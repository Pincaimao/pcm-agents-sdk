import * as Sentry from "@sentry/browser";

export default async function() {
    return await new Promise((resolve) => {
        Sentry.init({
            dsn: "https://d4dd33313afbf480bb76f965a5dcc733@sentry.ylzhaopin.com/9",
            integrations: [],
            beforeSend(event) {
                if (event.exception && event.exception.values) {
                    const errorValue = event.exception.values[0];
                    if (errorValue.stacktrace && errorValue.stacktrace.frames) {
                        const isFromSdk = errorValue.stacktrace.frames.some(
                            frame => frame.filename && frame.filename.includes('pcm-')
                        );
                        if (!isFromSdk) {
                            return null;
                        }
                    }
                }
                return event;
            },
            tracesSampleRate: 0.1,
        });
        resolve({});
    });
}

