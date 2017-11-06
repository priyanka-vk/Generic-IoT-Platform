// function to create a hidden form and submit the project details to the '/projectDetails' route

function myfunction(project_id, project_name, description) {
  var url = '/projectDetails';
  var form = $('<form action="' + url + '" method="post">' +
    '<input type="hidden" name="project_id" value="' + project_id + '" />' +
    '<input type="hidden" name="project_name" value="' + project_name + '" />' +
    '<input type="hidden" name="description" value="' + description + '" />' +
    '</form>');
  $('body').append(form);
  form.submit();
}
