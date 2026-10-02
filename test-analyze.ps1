# Run this in PowerShell while your server (npm run dev) is running in another terminal.

$body = @{
    resumeText = "Built a MERN e-commerce app using React, Node.js, Express, and MongoDB. Implemented JWT authentication. Familiar with Docker and basic ML in Python."
    jdText     = "We are hiring a Node.js backend developer with experience in Express, MongoDB, and Docker. Bonus: exposure to Python or ML."
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/analyze" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json -Depth 5