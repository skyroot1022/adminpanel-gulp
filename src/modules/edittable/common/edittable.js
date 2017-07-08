/*! editTable v0.1.1 by Alessandro Benoit */
(function ($, window, i) {

    'use strict';

    $.fn.prizeeditTable = function (options) {

        // Settings
        var s = $.extend({
                name: '',
                data: [['']],
                jsonData: false,
                headerCols: false,
                tabletype: '',
                maxRows: 999
            }, options),
            $el = $(this),
            defaultTableContent = '<thead><tr></tr></thead><tbody></tbody>',
            $table = $('<table/>', {
                class: 'inputtable' + ((!s.headerCols) ? ' wh' : ''),
                html: defaultTableContent
            }),
            defaultth = '<th><a class="addcol icon-button" href="#">+</a> <a class="delcol icon-button" href="#">-</a></th>',
            colnumber,
            rownumber,
            reset;

        // Increment for IDs
        i = i + 1;
        // Build cell
        function buildCell(content) {
            content = (content === 0) ? "0" : (content || '').toString();
            return '<td><input type="text" name="" value=" ' + content.replace(/"/g, "&quot;") + '" /></td>';
        }

        // Build row
        function buildRow(data, len) {

            var rowcontent = '', b;

            data = data || '';

            for (b = 0; b < (len || data.length); b += 1) {
                rowcontent += buildCell(data[b]);
            }

            return $('<tr/>', {
                html: rowcontent + '<td><a class="addrow icon-button" href="#">+</a> <a class="delrow icon-button" href="#">-</a></td>'
            });

        }

        // Check button status (enable/disabled)
        function checkButtons() {
            if (colnumber < 2) {
                $table.find('.delcol').addClass('disabled');
            }
            if (rownumber < 2) {
                $table.find('.delrow').addClass('disabled');
            }
            if (s.maxRows && rownumber === s.maxRows) {
                $table.find('.addrow').addClass('disabled');
            }
        }

        // Fill table with data
        function fillTableData(data) {

            var a, crow = Math.min(s.maxRows, data.length);

            // Clear table
            $table.html(defaultTableContent);

            // Populate table headers
            if (s.headerCols) {
                // Fixed columns                
                var balance = '<label class="form-label">'+s.headerCols[2]+'</label><input class="form-control text-right money-mask-input" id="sum_balance_'+s.tabletype+'" type="text" readonly>';
                var bonus = '<label class="form-label">'+s.headerCols[3]+'</label><input class="form-control text-right money-mask-input" id="sum_bonus_'+s.tabletype+'" type="text" readonly>';                
                
                $table.find('thead tr').append('<th>' + s.headerCols[0] + '</th>');
                $table.find('thead tr').append('<th>' + s.headerCols[1] + '</th>');
                $table.find('thead tr').append('<th>' + balance + '</th>');
                $table.find('thead tr').append('<th>' + bonus + '</th>');
                
                for (a = 0; a < crow; a += 1) {
                    buildRow(data[a], s.headerCols.length).appendTo($table.find('tbody'));
                }

                
            }

            // Append missing th
            $table.find('thead tr').append('<th></th>');

            // Count rows and columns
            colnumber = $table.find('thead th').length - 1;
            rownumber = $table.find('tbody tr').length;

            checkButtons();
        }

        // Export data
        function exportData() {
            var row = 0, data = [];

            $table.find('tbody tr').each(function () {

                row += 1;
                data[row] = [];

                $(this).find('input').each(function () {
                    data[row].push($(this).val());
                });

            });

            // Remove undefined
            data.splice(0, 1);

            return data;
        }

        // Fill the table with data from textarea or given properties
        if ($el.is('textarea')) {

            try {
                reset = JSON.parse($el.val());
            } catch (e) {
                reset = s.data;
            }

            $el.after($table);

            // If inside a form set the textarea content on submit
            if ($table.parents('form').length > 0) {
                $table.parents('form').submit(function () {
                    $el.val(JSON.stringify(exportData()));
                });
            }

        } else {
            reset = (JSON.parse(s.jsonData) || s.data);
            $el.append($table);
        }

        fillTableData(reset);
        
        function calcSum() {
            var balance=0, bonus=0;
            var mixTotal = 0;
            $('#prize'+s.tabletype+' tbody tr').each(function () {
                var val = parseFloat($(this).find('td:eq(2) input').val());           
                val = val?val:0;
                balance += val;

                val = parseFloat($(this).find('td:eq(3) input').val());
                val = val?val:0;
                bonus += val;
            });
            $("#sum_balance_"+s.tabletype).val(balance.toFixed(2));
            $("#sum_bonus_"+s.tabletype).val(bonus.toFixed(2));

            if(s.tabletype == "fixed") {
                if (balance != 100)
                    $("#sum_balance_fixed").attr("style", "color: maroon");
                else
                    $("#sum_balance_fixed").attr("style", "color: #eef0f4");
            }
            // $('#sum_balance_'+s.tabletype).trigger('input');
            // $('#sum_bonus_'+s.tabletype).trigger('input');
        }



        // Add column
        $table.on('click', '.addcol', function () {

            var colid = parseInt($(this).closest('tr').children().index($(this).parent('th')), 10);

            colnumber += 1;

            $table.find('thead tr').find('th:eq(' + colid + ')').after(defaultth);

            $table.find('tbody tr').each(function () {
                $(this).find('td:eq(' + colid + ')').after(buildCell());
            });

            $table.find('.delcol').removeClass('disabled');

            return false;
        });

        // Remove column
        $table.on('click', '.delcol', function () {

            if ($(this).hasClass('disabled')) {
                return false;
            }

            var colid = parseInt($(this).closest('tr').children().index($(this).parent('th')), 10);

            colnumber -= 1;

            checkButtons();

            $(this).parent('th').remove();

            $table.find('tbody tr').each(function () {
                $(this).find('td:eq(' + colid + ')').remove();
            });

            return false;
        });

        // Add row
        $table.on('click', '.addrow', function () {
            if ($(this).hasClass('disabled')) {
                return false;
            }

            rownumber += 1;

            $(this).closest('tr').after(buildRow(0, colnumber));

            $('#prizefixed td, #prizeproportional td').on('blur', 'input', function(event) {
                calcSum();                        
            });

            $table.find('.delrow').removeClass('disabled');

            checkButtons();

            calcSum();

            return false;
        });

        // Delete row
        $table.on('click', '.delrow', function () {

            if ($(this).hasClass('disabled')) {
                return false;
            }

            rownumber -= 1;

            checkButtons();            
            
            $(this).closest('tr').remove();

            $table.find('.addrow').removeClass('disabled');
            calcSum();
            console.log('delete');
            return false;
        });

        // Select all content on click
        $table.on('click', 'input', function () {
            $(this).select();
        });

                // Calc AddOn
        $('#prizefixed td, #prizeproportional').on('blur', 'input', function(event) {
            calcSum();                        
        });

        // Return functions
        return {
            // Get an array of data
            getData: function () {
                return exportData();
            },
            // Get the JSON rappresentation of data
            getJsonData: function () {
                return JSON.stringify(exportData());
            },
            // Load an array of data
            loadData: function (data) {
                fillTableData(data);
            },
            // Load a JSON rappresentation of data
            loadJsonData: function (data) {
                fillTableData(JSON.parse(data));
            },
            // Reset data to the first instance
            reset: function () {
                fillTableData(reset);
            }
        };
    };

})(jQuery, this, 0);