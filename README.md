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
QUERY_KEY='A secret key used to verify HMAC signatures for queries sent to this form via URL'
```

## Install & Run the Application locally with Node.js

### Prerequisites

- [Node.js](https://nodejs.org/en/) - v.20.16.0 or compatible version
- [Redis server](http://redis.io/download) running on default port 6379

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

7. The volumes configured in `docker-compose.yml` should allow for hot-reloading of changes to files in the `/apps`, `/assets` and `/utils` folders. Changes to other root level files may require a container rebuild with `docker-compose build` or at least to `docker-compose down` and then a fresh `docker-compose up`.

## Testing

### Linting Tests

`$ yarn test:lint`

### Unit Tests

`$ yarn test:unit`

## Deployment

This application is containerised and ready for deployment on Kubernetes. Refer to the `kube/` directory for Kubernetes deployment scripts.

## Linking to this feedback form from another HOF project

In a HOF project the feedback banner and URL are enabled by adding it to res.locals via an `app.use` function in the server.js of that project e.g.

```javascript
app.use((req, res, next) => {
  res.locals.feedbackUrl = 'https://hof-feedback.homeoffice.gov.uk';
  next();
});
```

The URL can also be added from a config file or environment variables. The `res.locals.feedbackUrl` can be added in this way alongside other local values such as `htmlLang`.

### Query parameters

When linking to this feedback form from other HOF forms you can add query context in the format e.g. `https://hof-feedback.homeoffice.gov.uk/feedback?form=ASC&returnUrl=https://www.google.com&mac=GENERATED_MAC`.

> **_NOTE:_**  If you are providing query parameters for context you must add them to the `/feedback` route. You can access the feedback form via the root URL and it will redirect to `/feedback`, but it will not collect context from the query unless the `/feedback` route is targeted directly.

The parameters that can be included are:

- `form`: Must be alphanumeric but can include `' '` (space), `_` or `-`
- `returnUrl`: Must have a full URL format that will parse with the Javascript URL object e.g. `https://service.homeoffice.gov.uk` or `https://www.service.homeoffice.gov.uk`
- `mac`: A HMAC signature of the rest of the query string. This is required for the app to trust query parameters and add context to feedback notifications. Please see below for instructions on generating a HMAC to add to your querystring.

All other parameters added to the query will be ignored.

If a 'form' parameter is given it will include this as the service name the feedback is related to in the submission email. If you are linking from another HOF form to this feedback form you can include this parameter in the query so that feedback recipients can tell it is related to your service.

If a 'returnUrl' parameter is given alongside a 'form' parameter then the feedback submission notification will include a link back to the form it is related to. Without an accompanying 'form' parameter the 'returnUrl' parameter will be ignored.

If no 'mac' parameter is given alongside other query data then the app will ignore the query altogether. The HMAC verifies that the query is sent from a trusted source.

Including these parameters in links to this form is optional, but may improve the context of the feedback if the user did not otherwise indicate which HOF form they were giving feedback for. A user can still link to and submit a feedback form without the query element, but some useful context may be missing from their answers.

### Creating a MAC for your querystring

To have your querystring trusted by this application it will need to be signed by a HMAC that is then appended to the querystring as 'mac'. e.g.

`https://hof-feedback.homeoffice.gov.uk/feedback?form=ASC&returnUrl=https://www.asc.homeoffice.gov.uk`

must become

`https://hof-feedback.homeoffice.gov.uk/feedback?form=ASC&returnUrl=https://www.asc.homeoffice.gov.uk&mac=461d6959f3f14744c3dc72293545013317da289011c79de1ba18d37917a104d0`

#### HMAC generation Prerequisites

- The secret key to sign the MAC with.
- Local binaries `openssl` and `xxd`
- ...or any other method of generating a HMAC from a message and key with SHA256 algorithm and hex encoded output.

#### HMAC generation steps

1. Take the original querystring including the '?': `?form=ASC&returnUrl=https://www.asc.homeoffice.gov.uk`
2. Use your terminal to generate the hashed message as below (or using your own method)
3. Append the generated HMAC as the 'mac' value in the complete querystring of your URL.
4. Add the complete URL to your HOF project wherever you need a link to the feedback form.

```bash
echo -n "?form=ASC&returnUrl=https://www.asc.homeoffice.gov.uk" | openssl dgst -sha256 -hmac "skeletonKey" -binary | xxd -p
# returns 461d6959f3f14744c3dc72293545013317da289011c79de1ba18d37917a104d0
```
