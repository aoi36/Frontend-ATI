// src/pages/MeetSchedulerPage.jsx

import React from "react"
import { useState } from "react"
import Card from "../components/Card"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorAlert from "../components/ErrorAlert"
import { apiCall } from "../utils/api"
import "./MeetSchedulerPage.css"

/**
 * [NEW] Helper function to parse flexible time input
 * "20" -> "20:00"
 * "9" -> "09:00"
 * "14:30" -> "14:30"
 */
const formatTime = (timeStr) => {
  if (!timeStr) return null;
  
  // Case 1: User just typed "20" or "9"
  if (/^\d{1,2}$/.test(timeStr)) {
    const hour = parseInt(timeStr, 10);
    if (hour >= 0 && hour < 24) {
      return `${String(hour).padStart(2, '0')}:00`; // 9 -> "09:00", 20 -> "20:00"
    }
  }
  
  // Case 2: User typed "20:30" or "9:15"
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [hour, min] = timeStr.split(':');
    const hourInt = parseInt(hour, 10);
    const minInt = parseInt(min, 10);
    if (hourInt >= 0 && hourInt < 24 && minInt >= 0 && minInt < 60) {
      return `${String(hourInt).padStart(2, '0')}:${String(minInt).padStart(2, '0')}`;
    }
  }
  
  // Invalid format
  return null;
};

function MeetSchedulerPage() {
  const [meetLink, setMeetLink] = useState("")
  
  // --- [FIX 1] ---
  // Split state into two user-friendly fields
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]); // Defaults to today
  const [joinTime, setJoinTime] = useState(""); // e.g., "20:00" or "20"
  // --- [END FIX] ---

  const [duration, setDuration] = useState("60")
  const [userName, setUserName] = useState("Assistant")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSchedule = async (e) => {
    e.preventDefault()

    if (!meetLink.trim() || !meetLink.startsWith("https://meet.google.com/")) {
      setError("Please enter a valid Google Meet link")
      return
    }

    // --- [FIX 2] ---
    // Validate and combine the new date/time inputs
    if (!joinDate.trim()) {
      setError("Please select a join date")
      return
    }
    const formattedTime = formatTime(joinTime);
    if (!formattedTime) {
      setError("Invalid time. Please use 'HH' (e.g., 20) or 'HH:MM' (e.g., 20:30).");
      setLoading(false);
      return;
    }
    
    // Create the full ISO-like string for the backend
    const join_datetime_str = `${joinDate}T${formattedTime}`;
    
    // Check if the selected time is in the past
    if (new Date(join_datetime_str) < new Date()) {
      setError("Cannot schedule a meeting in the past. Please select a future time.");
      return;
    }
    // --- [END FIX] ---

    if (!duration.trim() || parseInt(duration) <= 0) {
        setError("Please enter a positive duration in minutes")
        return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // --- [FIX 3] ---
      // Send the combined datetime string to the API
      const data = await apiCall("/api/schedule_meet", {
        method: "POST",
        body: { // Send as a raw object, apiCall will stringify it
          meet_link: meetLink,
          join_datetime_str: join_datetime_str, // Send the "YYYY-MM-DDTHH:MM" string
          duration_minutes: duration,
          user_name: userName
        },
        headers: { "Content-Type": "application/json" },
        isFormData: false 
      })
      // --- [END FIX] ---

      setSuccess(data.status || "Meeting scheduled successfully!")
      setMeetLink("")
      setJoinTime("")
      setDuration("60")
    } catch (err) {
      setError(err.message || "Failed to schedule meeting")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="meet-scheduler-page">
      <h1 className="page-title">Schedule Google Meet Recording</h1>
      <div className="scheduler-container">
        <Card className="form-card">
          <h2 className="card-title">Schedule a New Meeting</h2>
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
          {success && (
            <div className="success-alert">
              <span className="success-icon">✓</span>
              <p className="success-message">{success}</p>
            </div>
          )}

          <form onSubmit={handleSchedule} className="schedule-form">
            <div className="form-group">
              <label className="form-label">Google Meet Link</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://meet.google.com/abc-xyz-uvw"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bot Display Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Name the bot will use to join"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>

            {/* --- [FIX 4] --- */}
            {/* Split datetime-local into two more usable inputs */}
            <div className="form-group-split">
              <div className="form-group">
                <label className="form-label">Join Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Can't select past dates
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Join Time (HH:MM)</label>
                <input
                  type="text" // Use 'text' for flexible input
                  className="form-input"
                  placeholder="e.g., 20 or 20:30"
                  value={joinTime}
                  onChange={(e) => setJoinTime(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* --- [END FIX] --- */}

            <div className="form-group">
              <label className="form-label">Recording Duration (in minutes)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                min="1"
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Meeting"}
            </button>
          </form>
        </Card>
        
       <Card className="info-card">
          <h2 className="card-title">How it works</h2>
          <div className="info-content">
            <div className="info-step">
              <span className="step-number">1</span>
              <p className="step-text">Enter the Google Meet link.</p>
            </div>
            <div className="info-step">
              <span className="step-number">2</span>
              <p className="step-text">Choose the exact date and time for the bot to join.</p>
            </div>
            <div className="info-step">
              <span className="step-number">3</span>
              <p className="step-text">Set a display name for the bot (e.g., "Note Taker").</p>
            </div>
            <div className="info-step">
              <span className="step-number">4</span>
              <p className="step-text">Set the recording duration in minutes.</p>
            </div>
             <div className="info-step">
              <span className="step-number">5</span>
              <p className="step-text">The assistant will join, record, and transcribe the meeting at the scheduled time.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default MeetSchedulerPage