#! /bin/bash
set -e

export INGRESS_INTERNAL_ANNOTATIONS=$HOF_CONFIG/ingress-internal-annotations.yaml
export INGRESS_EXTERNAL_ANNOTATIONS=$HOF_CONFIG/ingress-external-annotations.yaml
export CONFIGMAP_VALUES=$HOF_CONFIG/configmap-values.yaml
export NGINX_SETTINGS=$HOF_CONFIG/nginx-settings.yaml

kd='kd --insecure-skip-tls-verify --timeout 10m --check-interval 10s'

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
  local sanitized_branch

  sanitized_branch=$(echo "$raw_branch" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')

  if [[ -z "$sanitized_branch" ]]; then
    sanitized_branch='branch'
  fi

  sanitized_branch="${sanitized_branch:0:max_length}"
  sanitized_branch=$(echo "$sanitized_branch" | sed -E 's/-+$//')

  if [[ -z "$sanitized_branch" ]]; then
    sanitized_branch='branch'
  fi

  echo "$sanitized_branch"
}

if [[ $1 == 'tear_down' ]]; then
  export KUBE_NAMESPACE=$BRANCH_ENV
  export BRANCH_SLUG_MAX_LENGTH=$(compute_branch_slug_max_length)
  export DRONE_SOURCE_BRANCH=$(sanitize_branch_name "$(cat /root/.dockersock/branch_name.txt)" "${BRANCH_SLUG_MAX_LENGTH}")

  $kd --delete -f kube/configmaps/configmap.yml
  $kd --delete -f kube/redis -f kube/app
  echo "Torn Down Branch - hff-$DRONE_SOURCE_BRANCH.internal.branch.sas-notprod.homeoffice.gov.uk"
  exit 0
fi

export KUBE_NAMESPACE=$1
export BRANCH_SLUG_MAX_LENGTH=$(compute_branch_slug_max_length)
export DRONE_SOURCE_BRANCH=$(sanitize_branch_name "${DRONE_SOURCE_BRANCH}" "${BRANCH_SLUG_MAX_LENGTH}")

if [[ ${KUBE_NAMESPACE} == ${BRANCH_ENV} ]]; then
  $kd -f kube/configmaps -f kube/certs
  $kd -f kube/redis -f kube/app
elif [[ ${KUBE_NAMESPACE} == ${UAT_ENV} ]]; then
  $kd -f kube/configmaps/configmap.yml -f kube/app/service.yml
  $kd -f kube/app/networkpolicy-internal.yml -f kube/app/ingress-internal.yml
  $kd -f kube/app/networkpolicy-external.yml -f kube/app/ingress-external.yml
  $kd -f kube/redis -f kube/app/deployment.yml
elif [[ ${KUBE_NAMESPACE} == ${PROD_ENV} ]]; then
  $kd -f kube/configmaps/configmap.yml -f kube/app/service.yml
  $kd -f kube/app/networkpolicy-external.yml -f kube/app/ingress-external.yml
  $kd -f kube/redis -f kube/app/deployment.yml
fi

sleep $READY_FOR_TEST_DELAY

if [[ ${KUBE_NAMESPACE} == ${BRANCH_ENV} ]]; then
  BRANCH_HOST="$APP_NAME-$DRONE_SOURCE_BRANCH.internal.branch.sas-notprod.homeoffice.gov.uk"
  echo "Branch url - $BRANCH_HOST"
  if [[ -d /root/.dockersock ]]; then
    echo "$BRANCH_HOST" > /root/.dockersock/branch_url.txt
  fi
fi
