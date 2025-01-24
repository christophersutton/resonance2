interface Config {
    corsOrigin: string;
    dbPath: string;
}

function validateConfig(config: Partial<Config>): config is Config {
    if (!config.corsOrigin) {
        throw new Error('CORS_ORIGIN environment variable is required');
    }
    if (!config.dbPath) {
        throw new Error('DB_PATH environment variable is required');
    }
    return true;
}

export function loadConfig(): Config {
    const config: Partial<Config> = {
        corsOrigin: process.env.CORS_ORIGIN,
        dbPath: process.env.DB_PATH
    };

    validateConfig(config);
    return config as Config;
}

// Load and validate config immediately
export const config = loadConfig();