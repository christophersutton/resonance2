interface Config {
    corsOrigin: string;
    dbPath: string;
    auth: {
        jwtSecret: string;
        mailgun: {
            apiKey: string;
            domain: string;
            webhookSigningKey: string;
        };
        appUrl: string;
        openai: {
            apiKey: string;
            model: string;
        };
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
                webhookSigningKey: getRequiredEnvVar('MAILGUN_WEBHOOK_SIGNING_KEY'),
            },
            appUrl: getRequiredEnvVar('CORS_ORIGIN'),
            openai: {
                apiKey: process.env.OPENAI_API_KEY || '',
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
            }
        }
    };

    return config;
}

// Load and validate config immediately
export const config = loadConfig();