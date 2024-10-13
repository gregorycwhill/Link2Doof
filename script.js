// Activate tooltip
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

// Initialize Sortable on the accordion
var sortable = new Sortable(document.getElementById('sortableAccordion'), {
    animation: 150,
    handle: '.card-header',
});

// Function to fetch recommendations from OpenAI API
async function fetchRecommendations() {
    const apiKey = document.querySelector('input[placeholder="API Key"]').value;
    const mbtiType = document.getElementById('mbti-dropdown').value;
    const profileText = document.getElementById('profile-input').value;
    const targetGenre = "Progressive Psytrance";

    console.log("Fetching recommendations...");
    console.log("API Key:", apiKey);
    console.log("Myers-Briggs Type:", mbtiType);
    console.log("Profile Text:", profileText);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful music adviser who provides detailed personalised recommendations for a target genre. You will output five reasons your client should listen to the genre of music. Each reason should make specific reference to an aspect of the client's life based on their profile, such as roles, locations, studies, accolades, goals or causes. Your output should be a JSON object with the following keys: 1. **introduction**: A personalized greeting that includes mild flattery and encouragement based on the client's profile. 2. **recommendations**: An array of objects, each containing a **heading** and **body** explaining why this recommendation is relevant to the client. 3. **summary**: A summary of how the recommendations relate to the client’s life."
                    },
                    {
                        "role": "user",
                        "content": JSON.stringify({
                            "target_genre": targetGenre,
                            "myers_briggs_type": mbtiType,
                            "client_profile": profileText
                        })
                    }
                ],
                "max_tokens": 2048,
				response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const structuredContent = data.choices[0].message.content;

        console.log("API response received:", structuredContent);

        // Replace the text on the webpage
		document.querySelector('.intro-section em').innerText = targetGenre;
        updateContent(structuredContent);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
    }
}

function updateContent(content) {
    const parsedContent = JSON.parse(content);
    console.log("Parsed Content:", parsedContent);

    // Update Introduction

    document.querySelector('.intro-section p').innerText = parsedContent.introduction;

    // Update Recommendations
    const accordion = document.getElementById('sortableAccordion');
    accordion.innerHTML = ''; // Clear existing content

    if (Array.isArray(parsedContent.recommendations)) {
        parsedContent.recommendations.forEach((rec, index) => {
            const cardHTML = `
                <div class="card">
                    <div class="card-header" id="${rec.heading.replace(/\s+/g, '')}">
                        <h5 class="mb-0">
                            <button class="accordion-button collapsed" type="button" data-toggle="collapse" data-target="#collapse${rec.heading.replace(/\s+/g, '')}" aria-expanded="false" aria-controls="collapse${rec.heading.replace(/\s+/g, '')}">
                                ${index + 1}. ${rec.heading} <!-- Numbered Heading -->
                            </button>
                        </h5>
                    </div>
                    <div id="collapse${rec.heading.replace(/\s+/g, '')}" class="collapse" aria-labelledby="${rec.heading.replace(/\s+/g, '')}" data-parent="#recommendationAccordion">
                        <div class="card-body">
                            ${rec.body}
                        </div>
                    </div>
                </div>
            `;
            accordion.innerHTML += cardHTML;
        });
        console.log("Recommendations updated.");
    } else {
        console.error("Recommendations is not an array:", parsedContent.recommendations);
        accordion.innerHTML = '<div class="card"><div class="card-body">No recommendations available.</div></div>';
    }

    // Update Summary
    document.querySelector('.summary-section').innerHTML = `<h5>Summary</h5><p>${parsedContent.summary}</p>`;
}

// Automatically populate API key from URL
function getApiKeyFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('key');
    if (apiKey) {
        document.querySelector('input[placeholder="API Key"]').value = apiKey;
        console.log("API Key populated from URL:", apiKey);
    }
}

// Button Click Event
document.getElementById('find-tunes-btn').addEventListener('click', async function() {
    console.log("Find my Tunes button clicked.");
    $('#spinnerModal').modal('show'); // Show spinner

    // Fetch recommendations
    await fetchRecommendations();

    $('#spinnerModal').modal('hide'); // Hide spinner

    // Show dynamic sections
    document.getElementById('introduction-section').style.display = 'block';
    document.getElementById('recommendationAccordion').style.display = 'block';
    document.querySelector('.summary-section').style.display = 'block';
    document.getElementById('musicCarousel').style.display = 'block'; // Show carousel
});

// Run when the page is loaded
window.onload = function() {
    getApiKeyFromUrl();
};
