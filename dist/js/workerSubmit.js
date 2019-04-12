"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Добавить данные к форме
 *
 * @param {FormData} formData
 * @param {Object} appendToForm
 * @returns {FormData}
 */
function addToForm(formData, appendToForm) {
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
            }
            else {
                formData.append(field, item);
            }
        });
    }
    return formData;
}
/**
 * Кастомный объект ответа от сервера
 */
class LiteResponse {
    constructor(response, isOk, status) {
        this.ok = isOk;
        this.status = status;
        if (isOk) {
            this.data = response;
            return;
        }
        this.error = response;
    }
}
onmessage = function (e) {
    return __awaiter(this, void 0, void 0, function* () {
        let params = e.data, postError = function (errorMessage) {
            let response = new Response(errorMessage);
            postMessage(new LiteResponse({ message: errorMessage }, false));
        };
        if (!params) {
            postError('Не были переданы необходимые параметры выполнения');
            return;
        }
        let url = params['url'];
        if (!url) {
            postError('Не был передан адрес обработчика отправки формы');
            return;
        }
        let formData = params['formData'];
        if (!formData || !Object.keys(formData).length) {
            postError('Форма пуста');
            return;
        }
        let body = addToForm(new FormData(), formData);
        let options = {
            method: 'POST',
            body: body,
            credentials: 'include',
            headers: params['headers']
        };
        fetch(url, options)
            .then(function (response) {
            return __awaiter(this, void 0, void 0, function* () {
                postMessage(new LiteResponse(yield response.json(), response.ok, response.status));
            });
        });
    });
};
//# sourceMappingURL=workerSubmit.js.map