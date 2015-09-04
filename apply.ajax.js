/**
 * Created by Александр on 05.05.14.
 */
    function isJSON(str) {
        try {
            var result = JSON.parse(str);
        } catch (e) {
            return false;
        }
        return result;
    }

    function request (params, async, type, callback, callbackError)
    {
        if (callbackError)
        {
            error = callbackError;
        }
        $.ajax({
            type: type,
            url: "/router.php",
            dataType: 'json',
            data: {
                JSONData: JSON.stringify(params)
            },
            async: async,
            success: function (data)
            {
                if (data.error !== undefined)
                {
                    error('Произошла ошибка: ' + data.error);
                }
                else if (data.redirect !== undefined)
                {
                    window.location = data.redirect;
                }
                else if (data.success !== undefined)
                {
                    if (callback !== undefined)
                    {
                        callback(data);
                    }
                    else
                    {
                        //Сообщение об успешном запросе
                    }
                }
                else
                {
                    error('Произошла ошибка');
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown)
            {
                error('Произошла ошибка ' + textStatus);
            }
        });
    }

    function setMultiData(data, parent)
    {
        if (data)
        {
            if (data.success !== undefined)
                data = data.success;

            if (data && !data.error && typeof(data) === 'object')
            {
                var set_length = data.length;
                for (var i = 0; i < set_length; i++)
                {
                    var element = parent.eq(0).clone(true).appendTo(parent.parent());
                    if (data[i])
                    {
                        setData(data[i], element);
                    }
                }
            }
        }
        return parent.parent();
    }

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

                parent.removeClass('clone');

                var objkeys = Object.keys(data);
                var len = objkeys.length;
                for (var i = 0; i < len; i++)
                {
                    var objkey = objkeys[i];
                    var tmp = isJSON(data[objkey]);
                    if (tmp && tmp.length)
                    {
                        data[objkey] = tmp;
                    }
                    if (typeof(data[objkey]) === 'object' && data[objkey] !== null)
                    {
                        setMultiData(data[objkey], parent.find('.' + objkey));
                    }
                    if (parent.hasClass('in_id_' + objkey))
                    {
                        parent.attr('id', data[objkey]);
                    }
                    if (parent.hasClass('in_name_' + objkey))
                    {
                        parent.attr('name', data[objkey]);
                        //parent.attr('name', data[objkey]);
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
                        parent.text(data[objkey]);
                    }
                    if (parent.hasClass('in_html_' + objkey))
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
                        //parent.find('.in_id_' + objkey).attr('name', data[objkey]);
                    }
                    if (parent.find('.in_name_' + objkey).length)
                    {
                        parent.find('.in_name_' + objkey).attr('name', data[objkey]);
                        //parent.find('.in_id_' + objkey).attr('name', data[objkey]);
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
                    if (parent.find('.in_html_' + objkey).length)
                    {
                        parent.find('.in_html_' + objkey).html(data[objkey]);
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

            return parent;
        }
        else
        {
            return false;
        }
    }