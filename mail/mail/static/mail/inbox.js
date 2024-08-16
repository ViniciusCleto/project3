document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit email button
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function show_view(view) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-data').style.display = 'none';
  document.querySelector(`#${view}`).style.display = 'block';
}

function compose_email() {
  show_view('compose-view');

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id) {

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    show_view('email-data');

    document.querySelector('#email-data').innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><strong>From: </strong>${email.sender}</li>
        <li class="list-group-item"><strong>To: </strong>${email.recipients}</li>
        <li class="list-group-item"><strong>Subject: </strong>${email.subject}</li>
        <li class="list-group-item"><strong>Timestamp: </strong>${email.timestamp}</li>
        <li class="list-group-item">${email.body}</li>
      </ul>
    `;

    // Archive/Unarchive button
    const btnArchive = document.createElement('button');
    if (!email.archived) {
      btnArchive.innerHTML = 'Archive';
      btnArchive.className = 'btn btn-success my-3 mr-2';
    } else {
      btnArchive.innerHTML = 'Unarchive';
      btnArchive.className = 'btn btn-danger my-3 mr-2';
    }
    btnArchive.addEventListener('click', function() {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
      })
      .then(() => { load_mailbox('archive')});
    });
    document.querySelector('#email-data').append(btnArchive);

    // Reply button
    const btnReply = document.createElement('button');
    btnReply.innerHTML = 'Reply';
    btnReply.className = 'btn btn-primary my-3';
    btnReply.addEventListener('click', function() {
      compose_email();

      // Populate fields
      document.querySelector('#compose-recipients').value = email.sender;
      let subject = email.subject;
      if(subject.split(' ', 1)[0] !== 'Re:') {
        subject = 'Re: ' + subject;
      }
      document.querySelector('#compose-subject').value = subject;

      // Populate the body with the original email content
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
    });
    document.querySelector('#email-data').append(btnReply);
  });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  show_view('emails-view');

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3 class='text-center m-3'>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Print emails
    emails.forEach(emailData => {

      // Create div for each emails
      const newEmailDiv = document.createElement('div');
      newEmailDiv.innerHTML = `
        <h6><strong>Sender: </strong>${emailData.sender}</h6>
        <h5><strong>Subject: </strong>${emailData.subject}</h5>
        <p>${emailData.timestamp}</p>
      `;

      // If read, change background color
      newEmailDiv.className = emailData.read ? 'list-group-item list-group-item-action list-group-item-secondary' : 'list-group-item list-group-item-action';

      // Add click event to view email
      newEmailDiv.addEventListener('click', function() {

        // Change to read
        fetch(`/emails/${emailData.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
        view_email(emailData.id);
      });
      document.querySelector('#emails-view').append(newEmailDiv);
    });
  });
}

function send_email(event) {
  event.preventDefault();
  
  // Get data from email
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send data
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      load_mailbox('sent');
  });
}
