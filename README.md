# Home Office Forms feedback form

The HOF feedback form provides a place for users to submit feedback on their experience of using HOF forms.

## Description

- Users of HOF forms are given an opportunity to provide feedback on those forms via a link in the 'phase banner'.
- The phase banner is usually at the top of each form page, declares the service a beta, and has a link to provide feedback.
- Users who wish to provide feedback will be forwarded to an instance of this feedback form.
- Submitted feedback is sent via email to the HOF team.

## Getting Started

- [Install & run locally with Node.js](#install--run-the-application-locally-with-nodejs)
- [Install & run locally with Docker Compose](#install--run-the-application-locally-with-docker-compose)
- [Linking to this feedback form from another HOF project](#linking-to-this-feedback-form-from-another-hof-project)
- [Generating HMAC and Constructing URL](#generating-hmac-and-constructing-url)

### Dependencies

- This form is built using the [HOF framework](https://github.com/UKHomeOfficeForms/hof)
- [Gov.uk Notify](https://www.notifications.service.gov.uk) to send notification emails

### Environment variables

```bash
NODE_ENV=development
REDIS_HOST='The hostname of the redis instance you want to use. e.g. hof-redis or 127.0.0.1'
NOTIFY_KEY='The API key for the development Notify project.'
FEEDBACK_INBOX='The inbox to send completed feedback to'
FEEDBACK_TEMPLATE_ID='The Notify template ID for the feedback email template.'
QUERY_KEY='A secret key used to verify HMAC signatures for queries sent to this form via URL'
```

## Install & Run the Application locally with Node.js

### Prerequisites

- [Node.js](https://nodejs.org/en/) - v.20.17.0 or compatible version
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

In a HOF project the feedback banner and URL are enabled by adding it as `res.locals.feedbackUrl` via an `app.use` function in the `server.js` of that project.

Add some `feedback` values to your `config.js`:

```javascript
{
  feedback: {
    url: 'https://hof-feedback.homeoffice.gov.uk', // required if you want a feedback banner and link to feedback form
    form: Buffer.from('<FORM>', 'utf8').toString('hex'), // hex encode your form name if you want to include this context in the feedback notification email
    returnUrl: Buffer.from('<RETURN URL>', 'utf8').toString('hex'), // hex encode a URL if you want a link back to your form included in the feedback email
    mac: 'pre-hashed mac of the above two params in a JSON object string' // required if you add one or both of form and returnUrl
  }
}
```

Assign the following to `res.locals.feedbackUrl`. See [below](#query-parameters) for information about use of query parameter context.

```javascript
// import values set in config
const { url, form, returnUrl, mac } = require('config.js').feedback;

// add the following template literal using above config values or a complete URL string to an app.use function
res.locals.feedbackUrl = `${url}?form=${form}&returnUrl=${returnUrl}&mac=${mac}`
```

Add and remove the query values from the above assignation as required.

Alternatively, the entire link can be generated and added as `config.feedback.url` with or without additional query context - See more in [Generating HMAC and Constructing URL](#generating-hmac-and-constructing-url)

### Query parameters

When linking to this feedback form from other HOF forms you can add query context.

The parameters that are accepted by this feedback form are:

- `form`: Must be alphanumeric but can include `' '` (space), `_` or `-`
- `returnUrl`: Must have a full URL format that will parse with the JavaScript URL object e.g. `https://service.homeoffice.gov.uk` or `https://www.service.homeoffice.gov.uk`
- `mac`: A HMAC signature of a JSON string containing the above two data. This is required for the app to trust query parameters and add context to feedback notifications. Please see below for instructions on generating a HMAC to add to your querystring.

All other parameters added to the query will be ignored.

If a 'form' parameter is given it be included as the service name the feedback is related to in the submission email. If you are linking from another HOF form to this feedback form you can include this parameter in the query so that feedback recipients can tell it is related to your service.

If a 'returnUrl' parameter is given alongside a 'form' parameter then the feedback submission email will include a link back to the form it is related to. Without an accompanying 'form' parameter the 'returnUrl' parameter will be ignored.

If no 'mac' parameter is given alongside other query data then the app will ignore the query altogether. The HMAC verifies that the query is sent from a trusted source.

Including these parameters in links to this form is optional, but may improve the context of the feedback if the user did not otherwise indicate which HOF form they were giving feedback for. A user can still link to and submit a feedback form without the query element, but some useful context may be missing from their answers.

### Creating a MAC for your URL query

To have your query parameters trusted by this application, the `form` and `returnUrl` parameters need to be hex encoded. Additionally, the query parameters must be signed by an HMAC that is then appended to the query string as 'mac'. e.g.

```bash
https://hof-feedback.homeoffice.gov.uk?form=FakeForm&returnUrl=https://www.fake-service.homeoffice.gov.uk
```

must become

```bash
https://hof-feedback.homeoffice.gov.uk?form=46616b65466f726d&returnUrl=68747470733a2f2f7777772e66616b652d736572766963652e686f6d656f66666963652e676f762e756b&mac=6d227b0cd8c368ab1aec2ffd899811f3e3cccc2566cfa934191f4b4311fd9177
```

The 'mac' parameter is generated as below from a hash of a JSON object string, a secret key and some settings for hashing algorithm and output encoding. The defaults are SHA256 hashing and hex encoding.

#### HMAC generation Prerequisites

- The secret key to sign the MAC with.
- A JavaScript object structure containing the hex encoded `form` and `returnUrl` values you want to include as context in the link
- Node.js - ideally use the same version running in this app.

#### Generating HMAC and Constructing URL

Acquire the secret key (`QUERY_KEY`) for your selected environment from Kubernetes secrets (or select your own if working locally).

To generate the link with HMAC using Node.js, you can use the following command. Make sure to replace the placeholders `<SECRET KEY>`, `<FORM>` and `<RETURN URL>` with your actual secret key, form and returnUrl you want to hash, respectively:

```javascript
node -e "const { createHmac } = require('node:crypto'); const { Buffer } = require('node:buffer'); const algorithm = 'sha256'; const key = '<SECRET KEY>'; const refObject = {form: Buffer.from('<FORM>', 'utf8').toString('hex'), returnUrl: Buffer.from('<RETURN URL>', 'utf8').toString('hex')}; const message = JSON.stringify(refObject); const encoding = 'hex'; const hmac = createHmac(algorithm, key).update(message).digest(encoding); console.log('https://hof-feedback.homeoffice.gov.uk?form=' + refObject.form + '&returnUrl=' + refObject.returnUrl + '&mac=' + hmac);"
```

_Please ensure that the object keys/params are in the order as given in the example above._

This will output a ready-to-use link with the HMAC for the given message, which you can then use as the feedback URL for your form.

Example:

```bash
node -e "const { createHmac } = require('node:crypto'); const { Buffer } = require('node:buffer'); const algorithm = 'sha256'; const key = 'skeletonKey'; const refObject = {form: Buffer.from('Fake Form', 'utf8').toString('hex'), returnUrl: Buffer.from('https://www.fake-service.homeoffice.gov.uk', 'utf8').toString('hex')}; const message = JSON.stringify(refObject); const encoding = 'hex'; const hmac = createHmac(algorithm, key).update(message).digest(encoding); console.log('https://hof-feedback.homeoffice.gov.uk?form=' + refObject.form + '&returnUrl=' + refObject.returnUrl + '&mac=' + hmac);"
```

Expected output:

```bash
https://hof-feedback.homeoffice.gov.uk?form=46616b6520466f726d&returnUrl=68747470733a2f2f7777772e66616b652d736572766963652e686f6d656f66666963652e676f762e756b&mac=ab0c7700775d6bcc9a2438b967cc0623c35943b3d9bf50808eedd86b05c673a3

```