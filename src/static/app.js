document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activitiesState = {};

  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "-- Select an activity --";
    activitySelect.appendChild(placeholderOption);

    Object.entries(activitiesState).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const participants = Array.isArray(details.participants) ? details.participants : [];
      const spotsLeft = details.max_participants - participants.length;
      const participantsList = participants.length > 0
        ? participants
            .map(
              (participant) => `
                <li class="participant-pill">
                  <span>${participant}</span>
                  <button class="participant-remove" type="button" aria-label="Remove ${participant}" data-activity="${name}" data-participant="${participant}">
                    ×
                  </button>
                </li>
              `
            )
            .join("")
        : '<li class="participants-empty">No participants yet</li>';

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <p class="participants-title">Participants</p>
          <ul class="participants-list">${participantsList}</ul>
        </div>
      `;

      activitiesList.appendChild(activityCard);

      activityCard.querySelectorAll(".participant-remove").forEach((button) => {
        button.addEventListener("click", async () => {
          const activity = button.dataset.activity;
          const participant = button.dataset.participant;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(participant)}`,
              { method: "DELETE", cache: "no-store" }
            );
            const result = await response.json();

            if (response.ok) {
              activitiesState[activity].participants = activitiesState[activity].participants.filter(
                (item) => item !== participant
              );
              renderActivities();
              messageDiv.textContent = result.message;
              messageDiv.className = "success";
            } else {
              messageDiv.textContent = result.detail || "An error occurred";
              messageDiv.className = "error";
            }

            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          } catch (error) {
            messageDiv.textContent = "Failed to remove participant. Please try again.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
            console.error("Error removing participant:", error);
          }
        });
      });

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();
      Object.assign(activitiesState, activities);
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok) {
        if (!activitiesState[activity]) {
          activitiesState[activity] = { participants: [], max_participants: 0 };
        }
        if (!activitiesState[activity].participants.includes(email)) {
          activitiesState[activity].participants.push(email);
        }
        renderActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

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

  fetchActivities();
});
