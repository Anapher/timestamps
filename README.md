# Timestamp Converter

A web application that converts Unix timestamps to human-readable dates and times. This tool supports multiple timezones and formats.

View the live demo: [https://anapher.github.io/timestamps/](https://anapher.github.io/timestamps/)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Deployment

This application is configured for deployment to GitHub Pages using GitHub Actions.

### Automatic Deployment with GitHub Actions

The application is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch. The deployment process is handled by a GitHub Actions workflow defined in `.github/workflows/deploy.yml`.

The workflow performs the following steps:
1. Checks out the code
2. Sets up Node.js
3. Installs dependencies
4. Builds the application
5. Deploys to GitHub Pages

No manual intervention is required for deployment.

### Manual Deployment

If needed, you can also deploy the application manually by running:

```bash
npm run deploy
```

This will build the application and push it to the `gh-pages` branch of your repository.

### GitHub Pages Configuration

The application is configured to be deployed at `https://anapher.github.io/timestamps/`. If you need to change this URL, update the `homepage` field in `package.json`.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
