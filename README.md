# Home Office Forms feedback form

The HOF feedback form provides a place for users to submit feedback on their experience of using HOF forms.

## Description

- Users of HOF forms are given an opportunity to provide feedback on those forms via a link in the 'phase banner'.
- The phase banner is usually at the top of each form page, declares the service a beta, and has a link to provide feedback.
- Users who wish to provide feedback will be forwarded to an instance of this feedback form.
- Submitted feedback is sent via email to the HOF team.

## Getting Started

- [Install & run locally](#install--run-the-application-locally)
- [Install & run locally with Docker Compose](#install--run-the-application-locally-with-docker-compose)

### Dependencies

- This form is built using the [HOF framework](https://github.com/UKHomeOfficeForms/hof)
- [Gov.uk Notify](https://www.notifications.service.gov.uk) to send notification emails
- [File Vault](https://github.com/UKHomeOffice/file-vault) to store and retrieve uploaded files

### Environment variables

```bash
NODE_ENV=development
REDIS_HOST='The hostname of the redis instance you want to use. e.g. hof-redis or 127.0.0.1'
NOTIFY_KEY='The API key for the development Notify project'
FEEDBACK_INBOX='The inbox to send completed feedback to'
FEEDBACK_TEMPLATE_ID='The Notify template ID for the feedback email template.'
```

## Install & Run the Application locally

### Prerequisites

- [Node.js](https://nodejs.org/en/) - v.20.15.0 or compatible version
- [Redis server](http://redis.io/download) running on default port 6379
- [File Vault](https://github.com/UKHomeOffice/file-vault) Service - running port 3000

### Setup

1. Create a `.env` file in the root directory and populate it with all the required environment variables for the project.
2. Install dependencies using the command `yarn`.
3. Start the service in development mode using `yarn start:dev`.

## Install & Run the Application locally with Docker Compose

You can containerise the application using [Docker](https://www.docker.com). The `docker-compose.yml` file orchestrates the multi-container application.

### Docker compose prerequisites

- [Docker](https://www.docker.com)

### Docker compose setup

By following these steps, you should be able to install and run your application using a Docker Compose. This provides a consistent development environment across different machines and ensures that all required dependencies are available.

1. Make sure you have [Docker installed and running on your machine](https://www.docker.com/products/docker-desktop/). Docker is needed to create and manage your containers.

2. Create a `.env` file in the root directory and populate it with all the required environment variables for the project.

3. Ensure that your `.env` file has `REDIS_HOST=hof-redis` (or the value is the hostname of your redis instance as given in `docker-compose.yml`).

4. From the root folder of this project run: `docker-compose up` or use `docker-compose up -d` to run in detatched mode.

5. The application should build and start automatically with all required containers and environment.

6. Once the containers are built and started, you can go inside the app container: `docker exec -it hff-hof-feedback-form-1 sh` (note: Docker containers may be named differently) or inspect the containers with Docker desktop.

7. The volumes configured in `docker-compose.yml` should allow for hot-reloading of changes to files in the `/apps` and `/assets` folders. Changes to other root files may require a container rebuild with `docker-compose build`.

## Testing

### Linting Tests

`$ yarn test:lint`

### Unit Tests

`$ yarn test:unit`

## Deployment

This application is containerised and ready for deployment on Kubernetes. Refer to the `kube/` directory for Kubernetes deployment scripts.

## Query parameters

When linking to this feedback form from other HOF forms you can add query context in the format e.g. `https://hof-feedback.homeoffice.gov.uk?form=ASC&returnUrl=https://www.google.com`.

The parameters that can be included are:

- `form`: Must be alphanumeric but can include `' '` (space), `_` or `-`
- `returnUrl`: Must have a full URL format that will parse with the Javascript URL object and end with '.homeoffice.gov.uk' e.g. `https://service.homeoffice.gov.uk`

All other parameters added to the query will be ignored.

If a 'form' parameter is given it will include this as the service name the feedback is related to in the submission email. If you are linking from another HOF form to this feedback form you can include this parameter in the query so that feedback recipients can tell it is related to this service.

If a 'returnUrl' parameter is given alongside a 'form' parameter then the feedback submission notification will include a link back to the form it is related to. Without an accompanying 'form' parameter the 'returnUrl' parameter will be ignored.

Including these parameters in links to this form is optional, but may improve the context of the feedback if the user did not otherwise indicate which HOF form they were giving feedback for.
