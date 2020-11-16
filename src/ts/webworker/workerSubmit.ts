'use strict';

import {Translate} from '../../../../translate.js/dist/translate.js';

const t = new Translate('../translates');

/**
 * Добавить данные к форме
 *
 * @param {FormData} formData
 * @param {Object} appendToForm
 * @returns {FormData}
 */
function addToForm(formData : FormData, appendToForm : Object) : FormData {

    if (typeof appendToForm === "undefined") {
        return formData;
    }

    for (let field in appendToForm) {
        if (!appendToForm.hasOwnProperty(field)) {
            continue;
        }

        if (!Array.isArray(appendToForm[field])) {
            appendToForm[field] = [appendToForm[field]];
        }

        appendToForm[field].forEach(function (item) {
            if (item.name) {
                formData.append(field, item, item.name);
            } else {
                formData.append(field, item);
            }
        });
    }

    return formData;
}

interface Data {
    [prop : string] : any
}

class LiteResponse {

    public constructor(
        public readonly data : Data,
        public readonly ok : boolean,
        public readonly status : number,
        public readonly isJson : boolean
    ) {
    }
}

onmessage = async function (e) {

    let params : { [prop : string] : any } = e.data,
        postError = function (errorMessage : string) : void {
            postMessage(new LiteResponse({message: errorMessage}, false, 400));
        };

    if (!params) {
        postError(t.translate('required-params-not-found'));
        return;
    }

    let url : string = params['url'];
    if (!url) {
        postError(t.translate('form-handler-not-found'));
        return;
    }

    let formData : Object = params['formData'];
    if (!formData || !Object.keys(formData).length) {
        postError(t.translate('empty-form'));
        return;
    }

    let body : FormData = addToForm(new FormData(), formData);

    let options : RequestInit = {
        method: 'POST',
        body: body,
        credentials: 'include',
        headers: params['headers']
    };

    fetch(url, options)
        .then(async function (response : Response) : Promise<void> {
            const isJson = response.headers.get('Content-Type').includes('application/json');
            // @ts-ignore
            postMessage(
                new LiteResponse(
                    isJson ? await response.json() : await response.text(),
                    response.ok,
                    response.status,
                    isJson
                )
            );
        });
};
