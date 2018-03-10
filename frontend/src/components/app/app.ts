import Vue from "vue";
import Component from "vue-class-component";

import Error from "../error/error.vue";
import { API_HOST } from "../../config";

interface ErrorDetails {
    title: string;
    details: string;
    showLogin: boolean;
}

const ERRORS: { [key: number]: ErrorDetails } = {
    401: {
        title: "Not Authenticated",
        details: "To perform this action, you need to be logged in. Log in, then try what you were doing again.",
        showLogin: true
    },
    403: {
        title: "No Permissions",
        details: "It looks like you don't have permissions to do this. Double check that what you were trying to do makes sense.",
        showLogin: false
    },
    500: {
        title: "Oops",
        details: "Something went horribly wrong trying to process your request. Uhh... try again I guess?",
        showLogin: false
    }
};

@Component({
    components: {
        Error
    }
})
export default class App extends Vue {
    error: null | ErrorDetails = null;

    /**
     * Makes a GET request to the specified API endpoint. If the endpoint returns
     * an error, it is handled here. If the endpoint returns 404, null is returned.
     * Else, the returned JSON is cast to the specified generic type.
     */
    public async get<T>(url: string): Promise<T | null> {
        const req = await fetch(API_HOST + url);

        if (ERRORS[req.status]) {
            this.error = ERRORS[req.status];
            return null;
        }

        return req.status === 404 ? null : await req.json();
    }

    /**
     * Makes a POST/PUT/PATCH/DELETE request to the specified API endpoint. If
     * the endpoint returns an error, it is handled here.
     */
    public async submit(url: string, method: string, data: any): Promise<void> {
        const req = await fetch(API_HOST + url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (ERRORS[req.status]) {
            this.error = ERRORS[req.status];
        }
    }
}