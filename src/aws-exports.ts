// AWS Amplify configuration
// These values will be replaced by environment variables in production

const awsconfig = {
  Auth: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH'
  }
};

export default awsconfig;