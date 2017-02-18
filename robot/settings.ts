
const commonConfig = {
};

const config = {
    dev: {
        LOG_LEVEL: 'debug'
    },
    product: {
    }
};

let env = process.env.NODE_ENV || 'dev';

export default Object.assign(commonConfig, config[env]);
