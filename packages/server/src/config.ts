interface Config {
    corsOrigin: string;
    dbPath: string;
    auth: {
        jwtSecret: string;
        mailgun: {
            apiKey: string;
            domain: string;
        };
        appUrl: string;
    };
}

function getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} environment variable is required`);
    return value;
}

export function loadConfig(): Config {
    const config: Config = {
        corsOrigin: getRequiredEnvVar('CORS_ORIGIN'),
        dbPath: getRequiredEnvVar('DB_PATH'),
        auth: {
            jwtSecret: getRequiredEnvVar('JWT_SECRET'),
            mailgun: {
                apiKey: getRequiredEnvVar('MAILGUN_API_KEY'),
                domain: getRequiredEnvVar('MAILGUN_DOMAIN'),
            },
            appUrl: getRequiredEnvVar('APP_URL')
        }
    };

    return config;
}

// Load and validate config immediately
export const config = loadConfig();