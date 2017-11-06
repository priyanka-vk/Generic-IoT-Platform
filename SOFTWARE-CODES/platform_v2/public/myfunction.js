
// Function to create hidden form and submit to '/visual' route
//On clicking on the device card, all its details are submitted to '/visual' route
function myfunction(device_id, device_name, device_type, description) {
  var url = '/visual';
  var form = $('<form action="' + url + '" method="post">' +
    '<input type="hidden" name="device_id" value="' + device_id + '" />' +
    '<input type="hidden" name="device_name" value="' + device_name + '" />' +
    '<input type="hidden" name="device_type" value="' + device_type + '" />' +
    '<input type="hidden" name="description" value="' + description + '" />' +
    '</form>');
  $('body').append(form);
  form.submit();
}


// function to copy the device id to clipboard
function copyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}


// Function to get time difference beween 'datetime' and current date
// Used to display when the device was created with resppect to current time
// Used in devices.ejs
function get_time_diff(datetime) {
  var datetime = typeof datetime !== 'undefined' ? datetime : "2014-01-01 01:02:03.123456";

  var datetime = new Date(datetime).getTime();
  var now = new Date().getTime();

  if (isNaN(datetime)) {
    return "";
  }


  if (datetime < now) {
    var milisec_diff = now - datetime;
  } else {
    var milisec_diff = datetime - now;
  }

  var days = Math.floor(milisec_diff / 1000 / 60 / (60 * 24));

  var date_diff = new Date(milisec_diff);
  date_diff.setHours(date_diff.getHours() - 5);
  date_diff.setMinutes(date_diff.getMinutes()-30);

  if (days >= 365) {
    return Math.floor(days / 365) + "years ago";
  } else if (days == 1) {
    return days + " day ago";
  } else if (days > 0) {
    return days + " days ago";
  } else if (date_diff.getHours() == 1) {
    return date_diff.getHours() + " hour ago";
  } else if (date_diff.getHours() > 0) {
    return date_diff.getHours() + " hours ago";
  } else if (date_diff.getMinutes() == 1) {
    return date_diff.getMinutes() + " min ago";
  } else if (date_diff.getMinutes() > 0) {
    return date_diff.getMinutes() + " mins ago";
  } else if (date_diff.getSeconds() == 1) {
    return date_diff.getSeconds() + " sec ago";
  } else if (date_diff.getSeconds() > 0) {
    return date_diff.getSeconds() + " secs ago";
  } else if (date_diff.getSeconds() == 0) {
    return "just now";
  }
}
