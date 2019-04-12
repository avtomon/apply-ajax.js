/**
 * Добавить данные к форме
 *
 * @param {FormData} formData
 * @param {Object} appendToForm
 * @returns {FormData}
 */
declare function addToForm(formData: FormData, appendToForm: Object): FormData;
interface Error extends Data {
    code: number;
    message: string;
    errors: string[];
}
interface Data {
    [prop: string]: any;
}
/**
 * Кастомный объект ответа от сервера
 */
declare class LiteResponse {
    readonly ok: boolean;
    readonly status: number;
    readonly data: Data;
    readonly error: Error;
    constructor(response: Data, isOk: boolean, status?: number);
}
