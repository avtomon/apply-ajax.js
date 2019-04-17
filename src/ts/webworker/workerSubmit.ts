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

    public constructor(public readonly data : Data, public readonly ok : boolean, public readonly status : number) {
    }
}

onmessage = async function (e) {

    let params : { [prop : string] : any } = e.data,
        postError = function (errorMessage : string) : void {
            postMessage(new LiteResponse({message: errorMessage}, false, 400));
        };

    if (!params) {
        postError('Не были переданы необходимые параметры выполнения');
        return;
    }

    let url : string = params['url'];
    if (!url) {
        postError('Не был передан адрес обработчика отправки формы');
        return;
    }

    let formData : Object = params['formData'];
    if (!formData || !Object.keys(formData).length) {
        postError('Форма пуста');
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
            postMessage(new LiteResponse(await response.json(), response.ok, response.status));
        });
};
