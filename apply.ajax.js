/**
 * Created by Александр on 05.05.14.
 */

    const HIDE_CLASS = 'clone';

    /**
     * Проверка и парсинг JSON-строки
     *
     * @param str - json-строка
     *
     * @returns {boolean}
     */
    function isJSON(str)
    {
        try
        {
            var result = JSON.parse(str);
        }
        catch (e)
        {
            return false;
        }
        return result;
    }

    /**
     * Умная обертка к Ajax-запросу к серверу
     *
     * @param params - параметры запроса к серверу
     * @param async - асинхронно ли отправляться запрос?
     * @param type - тип запроса (обычно GET или POST)
     *
     * @param callback - функция, отрабатывающая при успешном запросе
     * @param callbackError - функция, отрабатывающая при ошибочном результате запроса
     */
    function request (params, async, type, callback, callbackError)
    {
        params.get_instance = params.get_instance || false;
        params.static_method = params.static_method || false;
        params.pagecache_flush = params.pagecache_flush || false;

        var error = callbackError ? callbackError : window.error || null;

        $.ajax({
            type: type,
            url: "/router.php",
            dataType: 'json',
            data:
            {
                JSONData: JSON.stringify(params)
            },
            async: async,
            success: function (data)
            {
                if (data.error !== undefined)
                {
                    error('Произошла ошибка: ' + data.error);
                }
                else if (data.redirect)
                {
                    window.location = data.redirect;
                }
                else if (data.success !== undefined)
                {
                    callback ? callback(data) : (window.showOk ? showOk('Запрос успешно выполнен') : null);
                }
                else
                {
                    error('Произошла ошибка');
                }
            },
            error: function (XMLHttpRequest, textStatus)
            {
                error('Произошла ошибка ' + textStatus);
            }
        });
    }

    /**
     * Запилить данные в шаблон. При этом исходные элементы для вставки остаются неизменными и становятся невидимыми, в том время как данные
     * вставляются в их видимые копии, которые создаются перед вставкой
     *
     * @param data - данные для вставки
     * @param parent - jQuery-селектор блоков для вставки
     *
     * @returns {*}
     */
    function setMultiData(data, parent)
    {
        if (data && data.success !== undefined)
        {
            data = data.success;
            if (data[0] === undefined)
                data = [data];

            if (typeof(data) === 'object')
            {
                for(var j in parent)
                {
                    var p = parent.eq(j).addClass(HIDE_CLASS);
                    for (var i in data)
                    {
                        setData(data[i], p.clone(true).appendTo(p.parent()));
                    }
                }
            }
        }
        return parent.eq(0).parent();
    }

    /**
     * Запилить данные в шаблон. В отличие от предыдущей функции, здесь данные вставляются прямо в выбранные селектором элементы
     *
     * @param data - данные для вставки
     * @param parent - jQuery-селектор блоков для вставки
     *
     * @returns {*}
     */
    function setData (data, parent)
    {
        if (data)
        {
            if (data.success)
                data = data.success;

            if (!data.error && typeof(data) === 'object')
            {
                if (data[0] !== undefined)
                    data = data[0];

                parent.removeClass(HIDE_CLASS);

                var objkeys = Object.keys(data),
                    len = objkeys.length;

                for (var i = 0; i < len; i++)
                {
                    var objkey = objkeys[i],
                        tmp = isJSON(data[objkey]);

                    if (tmp && tmp.length)
                    {
                        data[objkey] = tmp;
                    }
                    if (typeof(data[objkey]) === 'object' && data[objkey] !== null)
                    {
                        setMultiData(data[objkey], parent.find('.' + objkey + '.parent'));
                    }
                    else
                    {
                        if (parent.hasClass('in_id_' + objkey))
                        {
                            parent.attr('id', data[objkey]);
                        }
                        if (parent.hasClass('in_name_' + objkey))
                        {
                            parent.attr('name', data[objkey]);
                        }
                        if (parent.hasClass('in_class_' + objkey))
                        {
                            parent.addClass(data[objkey].toString());
                        }
                        if (parent.hasClass('in_val_' + objkey) || parent.hasClass('in_value_' + objkey))
                        {
                            parent.val(data[objkey]);
                        }
                        if (parent.hasClass('in_title_' + objkey))
                        {
                            parent.attr('title', data[objkey]);
                        }
                        if (parent.hasClass('in_text_' + objkey))
                        {
                            parent.html(data[objkey]);
                        }
                        if (parent.hasClass('in_href_' + objkey))
                        {
                            parent.attr('href', parent.attr('href') ? parent.attr('href') + data[objkey] : data[objkey]);
                        }
                        if (parent.hasClass('in_src_' + objkey) && data[objkey])
                        {
                            parent.attr('src', data[objkey]);
                        }
                        if (parent.hasClass('in_alt_' + objkey))
                        {
                            parent.attr('alt', data[objkey]);
                        }
                        if (parent.hasClass('in_data-val_' + objkey))
                        {
                            parent.attr('data-val', data[objkey]);
                        }
                        if (parent.hasClass('in_for_' + objkey))
                        {
                            parent.attr('for', data[objkey]);
                        }
                        if (parent.hasClass('in_type_' + objkey))
                        {
                            parent.attr('type', data[objkey]);
                        }
                        if (parent.hasClass('in_prop_' + objkey))
                        {
                            parent.prop(data[objkey], true);
                        }


                        if (parent.find('.in_id_' + objkey).length)
                        {
                            parent.find('.in_id_' + objkey).attr('id', data[objkey]);
                        }
                        if (parent.find('.in_name_' + objkey).length)
                        {
                            parent.find('.in_name_' + objkey).attr('name', data[objkey]);
                        }
                        if (parent.find('.in_class_' + objkey).length)
                        {
                            parent.find('.in_class_' + objkey).addClass(data[objkey].toString());
                        }
                        if (parent.find('.in_val_' + objkey).length || parent.find('.in_value_' + objkey).length)
                        {
                            parent.find('.in_val_' + objkey + ', .in_value_' + objkey).val(data[objkey]);
                        }
                        if (parent.find('.in_title_' + objkey).length)
                        {
                            parent.find('.in_title_' + objkey).attr('title', data[objkey]);
                        }
                        if (parent.find('.in_text_' + objkey).length)
                        {
                            parent.find('.in_text_' + objkey).html(data[objkey]);
                        }
                        if (parent.find('.in_href_' + objkey).length)
                        {
                            if (parent.find('.in_href_' + objkey).attr('href') === undefined)
                                parent.find('.in_href_' + objkey).attr('href', '');
                            parent.find('.in_href_' + objkey).attr('href', parent.find('.in_href_' + objkey).attr('href') + data[objkey]);
                        }
                        if (parent.find('.in_src_' + objkey).length && data[objkey])
                        {
                            parent.find('.in_src_' + objkey).attr('src', data[objkey]);
                        }
                        if (parent.find('.in_alt_' + objkey).length)
                        {
                            parent.find('.in_alt_' + objkey).attr('alt', data[objkey]);
                        }
                        if (parent.find('.in_data-val_' + objkey).length)
                        {
                            parent.find('.in_data-val_' + objkey).attr('data-val', data[objkey]);
                        }
                        if (parent.find('.in_for_' + objkey).length)
                        {
                            parent.find('.in_for_' + objkey).attr('for', data[objkey]);
                        }
                        if (parent.find('.in_type_' + objkey).length)
                        {
                            parent.find('.in_type_' + objkey).attr('type', data[objkey]);
                        }
                        if (parent.find('.in_prop_' + objkey).length)
                        {
                            parent.find('.in_prop_' + objkey).prop(data[objkey], true);
                        }
                    }
                }
            }

            return parent;
        }
        else
        {
            return false;
        }
    }

    /**
     * Использовать один из двух предудущих методов вставки изходя из присутствия в старших тегах блоков для вставки класса, отвечающего
     * за сокрытие эталонных блоков (HIDE_CLASS)
     *
     * @param data - данные для вставки
     * @param parent - jQuery-селектор блоков для вставки
     *
     * @returns {boolean}
     */
    function insertData(data, parent)
    {
        for (var j in parent)
        {
            var p = parent.eq(j);
            if (p.hasClass(HIDE_CLASS))
            {
                setMultiData(data, p);
            }
            else
            {
                setData(data, p);
            }
        }
        return true;
    }