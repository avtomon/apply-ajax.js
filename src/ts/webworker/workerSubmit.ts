function addToForm(formData: FormData, appendToForm: Object): FormData {

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

onmessage = async function (e) {

    let params: { [prop: string]: any } = e.data,

        postError = function (errorMessage: string): void {
            postMessage({error: errorMessage});
        };

    if (!params) {
        postError('Не были переданы необходимые параметры выполнения');
        return;
    }

    let url: string = params['url'];
    if (!url) {
        postError('Не был передан адрес обработчика отправки формы');
        return;
    }

    let formData: Object = params['formData'];
    if (!formData || !Object.keys(formData).length) {
        postError('Форма пуста');
        return;
    }

    let body: FormData = addToForm(new FormData(), formData);

    let options: RequestInit = {
        method: 'POST',
        body: body,
        credentials: 'include',
        headers: params['headers']
    };

    fetch(url, options)
        .then(async function (response: Response): Promise<void> {
            if (!response.ok) {
                postError(response.statusText);
                return;
            }

            postMessage(await response.json());
        });
}