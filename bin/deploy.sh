#! /bin/bash
set -e

export INGRESS_INTERNAL_ANNOTATIONS=$HOF_CONFIG/ingress-internal-annotations.yaml
export INGRESS_EXTERNAL_ANNOTATIONS=$HOF_CONFIG/ingress-external-annotations.yaml
export CONFIGMAP_VALUES=$HOF_CONFIG/configmap-values.yaml
export NGINX_SETTINGS=$HOF_CONFIG/nginx-settings.yaml

kd='kd --insecure-skip-tls-verify --timeout 10m --check-interval 10s'
redis_storage_files='kube/redis//redis-persistent-volume.yml'
redis_runtime_files='kube/redis/redis-service.yml -f kube/redis/redis-network-policy.yml -f kube/redis/redis-deployment.yml'

compute_branch_slug_max_length() {
  local dns_label_limit=63
  local app_name_length=${#APP_NAME}
  local max_for_app_name
  local max_for_configmap_name
  local max_branch_length

  # ${APP_NAME}-${DRONE_SOURCE_BRANCH}
  max_for_app_name=$((dns_label_limit - app_name_length - 1))

  # ${APP_NAME}-configmap-${DRONE_SOURCE_BRANCH}
  max_for_configmap_name=$((dns_label_limit - app_name_length - 11))

  max_branch_length=$max_for_app_name
  if (( max_for_configmap_name < max_branch_length )); then
    max_branch_length=$max_for_configmap_name
  fi

  if (( max_branch_length < 8 )); then
    max_branch_length=8
  fi

  echo "$max_branch_length"
}

sanitize_branch_name() {
  local raw_branch="$1"
  local max_length="${2:-40}"
  local dependabot_payload
  local dependabot_dependency
  local sanitized_branch

  # Rewrite Dependabot npm/yarn base-branch update branches to a shorter, meaningful slug.
  # Example: dependabot-npm_and_yarn-master-eslint-10.4.1 -> dependabot-pr-eslint
  if [[ "$raw_branch" =~ ^dependabot[-/]npm_and_yarn[-/](master|main)[-/](.+)$ ]]; then
    dependabot_payload="${BASH_REMATCH[2]}"
    dependabot_payload=$(echo "$dependabot_payload" | tr '[:upper:]' '[:lower:]' | tr '/' '-')
    dependabot_payload=$(echo "$dependabot_payload" | sed -E 's/[^a-z0-9-]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')

    if [[ -n "$dependabot_payload" ]]; then
      dependabot_dependency="$dependabot_payload"

      # Trim trailing version token if present (e.g. package-1-2-3).
      if [[ "$dependabot_payload" =~ ^(.+)-([0-9][0-9a-z-]*)$ ]]; then
        dependabot_dependency="${BASH_REMATCH[1]}"
      # Trim trailing git hash token if present (e.g. package-b4f7b4df17).
      elif [[ "$dependabot_payload" =~ ^(.+)-([a-f0-9]{7,40})$ ]]; then
        dependabot_dependency="${BASH_REMATCH[1]}"
      fi

      dependabot_dependency=$(echo "$dependabot_dependency" | sed -E 's/^-+//; s/-+$//; s/-+/-/g')
      if [[ -z "$dependabot_dependency" ]]; then
        dependabot_dependency="dependency"
      fi

      sanitized_branch="dependabot-pr-${dependabot_dependency}"
    fi
  fi

  if [[ -n "$sanitized_branch" ]]; then
    sanitized_branch="${sanitized_branch:0:max_length}"
    sanitized_branch=$(echo "$sanitized_branch" | sed -E 's/-+$//')

    if [[ -z "$sanitized_branch" ]]; then
      sanitized_branch='branch'
    fi

    echo "$sanitized_branch"
    return
  fi

  sanitized_branch=$(echo "$raw_branch" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')

  if [[ -z "$sanitized_branch" ]]; then
    sanitized_branch='branch'
  fi

  # Keep branch slug short so generated Kubernetes resource names remain within DNS label limits.
  sanitized_branch="${sanitized_branch:0:max_length}"
  sanitized_branch=$(echo "$sanitized_branch" | sed -E 's/-+$//')

  if [[ -z "$sanitized_branch" ]]; then
    sanitized_branch='branch'
  fi

  echo "$sanitized_branch"
}

normalize_redis_persistence_settings() {
  REDIS_PERSISTENCE_ENABLED=${REDIS_PERSISTENCE_ENABLED:-}
  REDIS_PERSISTENCE_ACCESS_MODES=${REDIS_PERSISTENCE_ACCESS_MODES:-ReadWriteOnce}
  REDIS_PERSISTENCE_STORAGE_CLASS=${REDIS_PERSISTENCE_STORAGE_CLASS:-gp2-encrypted}
  REDIS_PERSISTENCE_EXISTING_CLAIM=${REDIS_PERSISTENCE_EXISTING_CLAIM:-}

  REDIS_PERSISTENCE_ENABLED=$(echo "$REDIS_PERSISTENCE_ENABLED" | tr '[:upper:]' '[:lower:]')

  if [[ ${KUBE_NAMESPACE} == ${PROD_ENV} ]]; then
    REDIS_PERSISTENCE_ENABLED=true
    REDIS_PERSISTENCE_SIZE=10Gi
  elif [[ ${KUBE_NAMESPACE} == ${BRANCH_ENV} ]]; then
    REDIS_PERSISTENCE_ENABLED=true
    REDIS_PERSISTENCE_SIZE=1Gi
  else
    REDIS_PERSISTENCE_ENABLED=false
  fi

  export REDIS_PERSISTENCE_ENABLED
  export REDIS_PERSISTENCE_ACCESS_MODES
  export REDIS_PERSISTENCE_STORAGE_CLASS
  export REDIS_PERSISTENCE_EXISTING_CLAIM
  export REDIS_PERSISTENCE_SIZE
}

deploy_redis() {
  if [[ ${REDIS_PERSISTENCE_ENABLED} == "true" && -z "${REDIS_PERSISTENCE_EXISTING_CLAIM}" ]]; then
    $kd -f ${redis_storage_files}
  fi

  $kd -f kube/redis/redis-config.yml -f ${redis_runtime_files}
}

delete_redis() {
  if [[ ${REDIS_PERSISTENCE_ENABLED} == "true" && -z "${REDIS_PERSISTENCE_EXISTING_CLAIM}" ]]; then
    $kd --delete -f ${redis_storage_files}
  fi

  $kd --delete -f kube/redis/redis-config.yml -f ${redis_runtime_files}
}

if [[ $1 == 'tear_down' ]]; then
  export KUBE_NAMESPACE=$BRANCH_ENV
  export BRANCH_SLUG_MAX_LENGTH=$(compute_branch_slug_max_length)
  export DRONE_SOURCE_BRANCH=$(sanitize_branch_name "$(cat /root/.dockersock/branch_name.txt)" "${BRANCH_SLUG_MAX_LENGTH}")
  normalize_redis_persistence_settings

  echo "Tearing Down Branch - $APP_NAME-$DRONE_SOURCE_BRANCH.internal.branch.sas-notprod.homeoffice.gov.uk"

  $kd --delete -f kube/configmaps/configmap.yml
  delete_redis
  $kd --delete -f kube/app
  echo "Torn Down Branch - $APP_NAME-$DRONE_SOURCE_BRANCH.internal.branch.sas-notprod.homeoffice.gov.uk"
  exit 0
fi

export KUBE_NAMESPACE=$1
export BRANCH_SLUG_MAX_LENGTH=$(compute_branch_slug_max_length)
export DRONE_SOURCE_BRANCH=$(sanitize_branch_name "${DRONE_SOURCE_BRANCH}" "${BRANCH_SLUG_MAX_LENGTH}")
normalize_redis_persistence_settings

if [[ ${KUBE_NAMESPACE} == ${BRANCH_ENV} ]]; then
  $kd -f kube/configmaps -f kube/certs -f kube/app
  deploy_redis
elif [[ ${KUBE_NAMESPACE} == ${UAT_ENV} ]]; then
  $kd -f kube/configmaps/configmap.yml -f kube/app/service.yml
  $kd -f kube/app/networkpolicy-internal.yml -f kube/app/ingress-internal.yml
  $kd -f kube/app/networkpolicy-external.yml -f kube/app/ingress-external.yml
  deploy_redis
  $kd -f kube/app/deployment.yml
elif [[ ${KUBE_NAMESPACE} == ${PROD_ENV} ]]; then
  $kd -f kube/configmaps/configmap.yml -f kube/app/service.yml
  $kd -f kube/app/networkpolicy-external.yml -f kube/app/ingress-external.yml
  deploy_redis
  $kd -f kube/app/deployment.yml
fi

sleep $READY_FOR_TEST_DELAY

if [[ ${KUBE_NAMESPACE} == ${BRANCH_ENV} ]]; then
  BRANCH_HOST="$APP_NAME-$DRONE_SOURCE_BRANCH.internal.branch.sas-notprod.homeoffice.gov.uk"
  echo "Branch url - $BRANCH_HOST"
  if [[ -d /root/.dockersock ]]; then
    echo "$BRANCH_HOST" > /root/.dockersock/branch_url.txt
  fi
fi
