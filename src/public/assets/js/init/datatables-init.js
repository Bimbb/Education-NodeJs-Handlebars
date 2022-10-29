(function ($) {
    //    "use strict";


    /*  Data Table
    -------------*/




    $('#bootstrap-data-table').DataTable({
        "language": {
			"decimal":        "",
			"emptyTable":     "No data available in table",
			"info":           "Showing _START_ to _END_ of _TOTAL_ entries",
			"infoEmpty":      "Showing 0 to 0 of 0 entries",
			"infoFiltered":   "(filtered from _MAX_ total entries)",
			"infoPostFix":    "",
			"thousands":      ",",
			"lengthMenu":     "Hiện thị _MENU_ Người",
			"loadingRecords": "Đang Tìm...",
			"processing":     "",
			"search":         "Tìm kiếm:",
			"zeroRecords":    "Không tìm thấy kết quả",
			"paginate": {
				"first":      "First",
				"last":       "Last",
				"next":       "Tiếp",
				"previous":   "Trước"
			},
			// "aria": {
			// 	"sortAscending":  ": activate to sort column ascending",
			// 	"sortDescending": ": activate to sort column descending"
			// },
			
			
		},
		lengthChange: false,
		"lengthMenu": [ [3, 6, 9, -1], [3, 6, 9, "All"] ],
		// 'columnDefs': [{ 'orderable': false, 'targets': [0] }],
		bInfo: false,
		
    });




    $('#bootstrap-data-table-export').DataTable({
        // dom: 'lBfrtip',
        // lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        // buttons: [
        //     'copy', 'csv', 'excel', 'pdf', 'print'
        // ]
    });
	
	$('#row-select').DataTable( {
			initComplete: function () {
				this.api().columns().every( function () {
					var column = this;
					var select = $('<select class="form-control"><option value=""></option></select>')
						.appendTo( $(column.footer()).empty() )
						.on( 'change', function () {
							var val = $.fn.dataTable.util.escapeRegex(
								$(this).val()
							);
	 
							column
								.search( val ? '^'+val+'$' : '', true, false )
								.draw();
						} );
	 
					column.data().unique().sort().each( function ( d, j ) {
						select.append( '<option value="'+d+'">'+d+'</option>' )
					} );
				} );
			}
		} );






})(jQuery);