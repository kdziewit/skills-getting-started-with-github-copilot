document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

          // Participants section (rendered below for better control)
          const participantsTitle = document.createElement("p");
          participantsTitle.className = "participants-title";
          participantsTitle.textContent = "Participants:";

          // Build participants list
          if (details.participants && details.participants.length > 0) {
            const participantsListEl = document.createElement("ul");
            participantsListEl.className = "participants-list";

            details.participants.forEach((p) => {
              const li = document.createElement("li");
              li.className = "participant-item";

              // participant text and remove button
              const span = document.createElement("span");
              span.className = "participant-email";
              span.textContent = p;

              const removeBtn = document.createElement("button");
              removeBtn.className = "participant-remove";
              removeBtn.setAttribute("aria-label", "Remove participant");
              removeBtn.dataset.activity = name;
              removeBtn.dataset.email = p;
              removeBtn.innerHTML = "&times;";

              li.appendChild(span);
              li.appendChild(removeBtn);
              participantsListEl.appendChild(li);
            });

            // Delegate click handler for remove buttons
            participantsListEl.addEventListener("click", async (e) => {
              if (!e.target.classList.contains("participant-remove")) return;
              const btn = e.target;
              const email = btn.dataset.email;
              const activityName = btn.dataset.activity;

              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                const data = await res.json();

                if (res.ok) {
                  // remove from local details and DOM
                  const idx = details.participants.indexOf(email);
                  if (idx > -1) details.participants.splice(idx, 1);

                  const li = btn.closest("li");
                  if (li) li.remove();

                  // Update availability display
                  const availabilityEl = activityCard.querySelector(".availability");
                  const newSpots = details.max_participants - details.participants.length;
                  if (availabilityEl) availabilityEl.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;

                  // If no participants left, show fallback
                  if (details.participants.length === 0) {
                    participantsListEl.remove();
                    const none = document.createElement("p");
                    none.className = "no-participants";
                    none.textContent = "No participants yet";
                    activityCard.appendChild(none);
                  }

                  messageDiv.textContent = data.message || "Participant removed";
                  messageDiv.className = "success";
                } else {
                  messageDiv.textContent = data.detail || "Failed to remove participant";
                  messageDiv.className = "error";
                }

                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              } catch (err) {
                console.error("Error removing participant:", err);
                messageDiv.textContent = "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              }
            });

            activityCard.appendChild(participantsTitle);
            activityCard.appendChild(participantsListEl);
          } else {
            const none = document.createElement("p");
            none.className = "no-participants";
            none.textContent = "No participants yet";
            activityCard.appendChild(participantsTitle);
            activityCard.appendChild(none);
          }

          activitiesList.appendChild(activityCard);

          // Add option to select dropdown
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show updated participants immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
