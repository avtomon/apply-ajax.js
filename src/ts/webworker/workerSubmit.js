var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
onmessage = function (e) {
    return __awaiter(this, void 0, void 0, function* () {
        let params = JSON.parse(e.data), postError = function (errorMessage) {
            postMessage(JSON.stringify({ error: errorMessage }));
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
        let body = new URLSearchParams(formData);
        let options = {
            method: 'POST',
            body: body,
            credentials: 'include',
            headers: params['headers']
        };
        let response = yield fetch(url, options)
            .then(function (response) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!response.ok) {
                    return response.statusText;
                }
                return yield response.json();
            });
        });
        postMessage(response);
    });
};
