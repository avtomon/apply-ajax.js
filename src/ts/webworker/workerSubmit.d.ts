/**
 * Добавить данные к форме
 *
 * @param {FormData} formData
 * @param {Object} appendToForm
 * @returns {FormData}
 */
declare function addToForm(formData: FormData, appendToForm: Object): FormData;
interface Data {
    [prop: string]: any;
}
declare class LiteResponse {
    readonly data: Data;
    readonly ok: boolean;
    readonly status: number;
    readonly isJson: boolean;
    constructor(data: Data, ok: boolean, status: number, isJson: boolean);
}
