import React, { useState, useEffect } from "react"
import Card from "../components/Card"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorAlert from "../components/ErrorAlert"
import "./HomeworkSubmitPage.css"

function HomeworkSubmitPage({ prefilledFile = null, prefilledFileName = null }) {
  const [assignmentUrl, setAssignmentUrl] = useState("")
  const [assignments, setAssignments] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [file, setFile] = useState(prefilledFile)
  const [prefilledFileInfo, setPrefilledFileInfo] = useState(prefilledFileName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [backendStatus, setBackendStatus] = useState("checking") // checking, online, offline

  // Fetch assignments on mount
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true)
        const response = await fetch("http://localhost:5000/api/assignments")
        if (response.ok) {
          const data = await response.json()
          setAssignments(data || [])
        }
      } catch (err) {
        console.error("Failed to load assignments:", err)
      } finally {
        setLoadingAssignments(false)
      }
    }
    fetchAssignments()
  }, [])

  // If prefilled file name is provided, fetch the actual file
  useEffect(() => {
    if (prefilledFileName && !prefilledFile) {
      const fetchPrefilledFile = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/homework/get_file/${prefilledFileName}`)
          if (response.ok) {
            const blob = await response.blob()
            const file = new File([blob], prefilledFileName)
            setFile(file)
          }
        } catch (err) {
          console.error("Failed to load prefilled file:", err)
        }
      }
      fetchPrefilledFile()
    }
  }, [prefilledFileName, prefilledFile])

  // Check backend connectivity on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("http://localhost:5000/", {
          method: "GET",
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        if (response.ok) {
          setBackendStatus("online")
        } else {
          setBackendStatus("offline")
          setError("Backend server is running but returning errors")
        }
      } catch (err) {
        setBackendStatus("offline")
        setError("Cannot connect to backend server. Please make sure it's running on port 5000.")
      }
    }
    checkBackend()
  }, [])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate inputs
    if (!assignmentUrl) {
      setError("Please enter the assignment URL")
      return
    }
    if (!username) {
      setError("Please enter your LMS username")
      return
    }
    if (!password) {
      setError("Please enter your LMS password")
      return
    }
    if (!file) {
      setError("Please select a file to submit")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("assignment_url", assignmentUrl)
      formData.append("username", username)
      formData.append("password", password)
      formData.append("file", file)

      const response = await fetch("http://localhost:5000/api/homework/submit", {
        method: "POST",
        body: formData
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // Server returned HTML or other non-JSON content
        const text = await response.text()
        console.error("Server returned non-JSON response:", text.substring(0, 200))
        throw new Error("Server error: Backend may not be running or endpoint not found")
      }

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message || "Homework submitted successfully!"
        })
        // Clear form
        setAssignmentUrl("")
        setUsername("")
        setPassword("")
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById("file-input")
        if (fileInput) fileInput.value = ""
      } else {
        setError(data.error || "Failed to submit homework")
      }
    } catch (err) {
      console.error("Submission error:", err)

      // Provide more helpful error messages
      let errorMessage = err.message
      if (err.message.includes("Backend may not be running")) {
        errorMessage = "Cannot connect to backend server. Please make sure:\n1. Backend server is running (python app.py in BACKEND-ATI folder)\n2. Server is running on port 5000\n3. No firewall is blocking the connection"
        setBackendStatus("offline")
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage = "Network error: Cannot reach backend server. Is it running?"
        setBackendStatus("offline")
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="homework-submit-page">
      <h1>Auto Submit Homework</h1>
      <p className="description">
        Automatically submit your homework to the LMS site. This feature will log in to your account,
        navigate to the assignment page, upload your file, and submit it for you.
      </p>

      {/* Backend Status Indicator */}
      {backendStatus === "checking" && (
        <Card className="status-card">
          <div className="status-checking">
            🔄 Checking backend connection...
          </div>
        </Card>
      )}

      {backendStatus === "online" && (
        <Card className="status-card status-online">
          <div className="status-message">
            ✓ Backend server is online and ready
          </div>
        </Card>
      )}

      {backendStatus === "offline" && (
        <Card className="status-card status-offline">
          <div className="status-message">
            ⚠️ Backend server is offline
            <p className="status-help">
              Please start the backend server by running: <code>cd BACKEND-ATI && python app.py</code>
            </p>
          </div>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="homework-form">
          <div className="form-group">
            <label htmlFor="assignment-select">
              Assignment <span className="required">*</span>
            </label>
            {loadingAssignments ? (
              <LoadingSpinner />
            ) : (
              <>
                <select
                  id="assignment-select"
                  value={assignmentUrl}
                  onChange={(e) => setAssignmentUrl(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select an assignment --</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.url}>
                      {assignment.course_name} - {assignment.title}
                    </option>
                  ))}
                  <option value="manual">➕ Enter URL manually</option>
                </select>
                <small className="help-text">
                  {assignments.length} assignment(s) available. Select one or enter URL manually.
                </small>
              </>
            )}
          </div>

          {/* Show manual URL input if "manual" is selected */}
          {assignmentUrl === "manual" && (
            <div className="form-group">
              <label htmlFor="assignment-url-manual">
                Assignment URL <span className="required">*</span>
              </label>
              <input
                type="url"
                id="assignment-url-manual"
                onChange={(e) => setAssignmentUrl(e.target.value)}
                placeholder="https://lms.fit.hanu.vn/mod/assign/view.php?id=18205"
                disabled={loading}
                required
              />
              <small className="help-text">
                Example: https://lms.fit.hanu.vn/mod/assign/view.php?id=18205
              </small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              LMS Username <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your LMS username"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              LMS Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your LMS password"
              disabled={loading}
              required
            />
            <small className="help-text security-note">
              🔒 Your credentials are only used for this submission and are not stored.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="file-input">
              Homework File <span className="required">*</span>
            </label>
            {prefilledFileInfo && (
              <div className="prefilled-file-info">
                📄 Using graded file: <strong>{prefilledFileInfo}</strong>
              </div>
            )}
            <input
              type="file"
              id="file-input"
              onChange={handleFileChange}
              disabled={loading}
              required={!file}
            />
            {file && (
              <small className="help-text">
                Selected: {file.name}
              </small>
            )}
              required
            />
            {file && (
              <div className="file-selected">
                ✓ Selected: {file.name}
              </div>
            )}
          </div>

          {error && <ErrorAlert message={error} />}

          {result && result.success && (
            <div className="success-message">
              <strong>✓ Success!</strong> {result.message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || backendStatus !== "online"}
          >
            {loading ? "Submitting..." : "Submit Homework"}
          </button>

          {backendStatus === "offline" && (
            <p className="offline-warning">
              ⚠️ Cannot submit: Backend server is offline
            </p>
          )}
        </form>
      </Card>

      {loading && (
        <Card>
          <div className="loading-container">
            <LoadingSpinner />
            <p className="loading-text">
              Submitting your homework... This may take a minute.
            </p>
            <p className="loading-subtext">
              The system is logging in, navigating to the assignment page, uploading your file, and submitting it.
            </p>
          </div>
        </Card>
      )}

      <Card className="info-card">
        <h3>How it works:</h3>
        <ol>
          <li>Enter the assignment URL from LMS</li>
          <li>Provide your LMS login credentials</li>
          <li>Select the file you want to submit</li>
          <li>Click "Submit Homework" and wait for the automation to complete</li>
        </ol>

        <h3>Important Notes:</h3>
        <ul>
          <li>Make sure the assignment is open for submission</li>
          <li>Your credentials are used only for this submission and are not saved</li>
          <li>The process may take 30-60 seconds to complete</li>
          <li>Always verify the submission on LMS after automation completes</li>
        </ul>
      </Card>
    </div>
  )
}

export default HomeworkSubmitPage

