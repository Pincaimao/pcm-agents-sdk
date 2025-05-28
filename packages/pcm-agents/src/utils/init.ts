import * as Sentry from "@sentry/browser";
export default async function() {
    return await new Promise((resolve) => {
        Sentry.init({
            dsn: "https://d4dd33313afbf480bb76f965a5dcc733@sentry.ylzhaopin.com/9",
            integrations: [],
        });
        resolve({});
       
    });
 
}

