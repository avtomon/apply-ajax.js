/**
 * Created by Александр on 05.05.14.
 */
    function popupNotification (message, is_error)
    {
        if ($('#colorbox .notification').length)
        {
            if (is_error)
            {
                $('#colorbox .notification').text(message).removeClass('green').addClass('red');
            }
            else
            {
                $('#colorbox .notification').text(message).removeClass('red').addClass('green');
            }
        }
    }

    function delPopupNotification ()
    {
        $('#colorbox .notification').text('');
    }

    function error (message)
    {
        $.colorbox({html: $('#error').clone().find('.error').removeClass('no_display').parent().html()});
        $('.error_text').text(message);
    }

    function request (params, async, type, callback, callbackError)
    {
        try
        {
            $.each(params, function (index, el)
            {
                if (this === undefined)
                {
                    throw new Error('Недостаточно параметров для исполнения запросов');
                }
            });
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
                        //$.colorbox({html: 'Произошла ошибка ' + data.error});
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
                            //$.colorbox({html: 'Данные успешно отправлены'});
                        }
                    }
                    else
                    {
                        //$.colorbox({html: 'Произошла ошибка'});
                        error('Произошла ошибка');
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown)
                {
                    //$.colorbox({html: 'Произошла ошибка ' + textStatus});
                    //error('Произошла ошибка ' + textStatus);
                }
            });
        }
        catch (e)
        {

        }
    }

    function setMultiData(data, parent, is_update)
    {
        if (data.success !== undefined)
            data = data.success;

        if (data !== null && !data.error && typeof(data) === 'object')
        {
            if (data[0])
            {
                var set_length = data.length;
                if (is_update === true)
                {
                    if (set_length !== parent.length)
                        throw 'Неравное количество объектов данных и объектов для измения';
                }
                for (var i = 0; i < set_length; i++)
                {
                    if (is_update === true)
                    {
                        setData(data[i], parent[i]);
                    }
                    else
                    {
                        var element = parent.clone(true).appendTo(parent.parent());
                        setData(data[i], element);
                    }
                }
                if (!is_update)
                {
                    parent.addClass('clone');
                }
            }
            else
            {
                setData('body', data);
            }
        }

        return false;
    }

    function setData (data, parent)
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
                    parent.attr('name', data[objkey]);
                }
                if (parent.hasClass('in_class_' + objkey))
                {
                    parent.addClass(data[objkey].toString());
                }
                if (parent.hasClass('in_val_' + objkey))
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
                if (parent.hasClass('in_href_' + objkey))
                {
                    if (parent.attr('href') === undefined)
                        parent.attr('href', '');
                    parent.attr('href', parent.attr('href') + data[objkey]);
                }
                if (parent.hasClass('in_src_' + objkey))
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
                if (parent.hasClass('in_prop_' + objkey))
                {
                    parent.prop(data[objkey], true);
                }


                if (parent.find('.in_id_' + objkey).length)
                {
                    parent.find('.in_id_' + objkey).attr('id', data[objkey]);
                    parent.find('.in_id_' + objkey).attr('name', data[objkey]);
                }
                if (parent.find('.in_class_' + objkey).length)
                {
                    parent.find('.in_class_' + objkey).addClass(data[objkey].toString());
                }
                if (parent.find('.in_val_' + objkey).length)
                {
                    parent.find('.in_val_' + objkey).val(data[objkey]);
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
                if (parent.find('.in_src_' + objkey).length)
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
                if (parent.find('.in_prop_' + objkey).length)
                {
                    parent.find('.in_prop_' + objkey).prop(data[objkey], true);
                }
            }
        }

        return false;
    }