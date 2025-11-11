import React from "react"
import { useState } from "react"
import Navigation from "./components/Navigation"
import Dashboard from "./pages/Dashboard"
import CoursesPage from "./pages/CoursesPage"
import SearchPage from "./pages/SearchPage"
import AIToolsPage from "./pages/AIToolsPage"
import MeetSchedulerPage from "./pages/MeetSchedulerPage"
import ScraperPage from "./pages/ScraperPage"
import FlashcardsPage from "./pages/FlashcardsPage"

import "./App.css"
import CourseDetailPage from "./pages/CourseDetailPage"

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [flashcardParams, setFlashcardParams] = useState(null)
  const [homeworkGraderParams, setHomeworkGraderParams] = useState(null);


  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "courses":
        return <CoursesPage setCurrentPage={setCurrentPage} 
            setSelectedCourse={setSelectedCourse} />
      case "search":
        return <SearchPage />
      case "tools":
        return <AIToolsPage />
      case "course-detail":
        if (selectedCourse) {
          return (
            <CourseDetailPage 
              course={selectedCourse} 
              setCurrentPage={setCurrentPage}
              setFlashcardParams={setFlashcardParams}
            />
          )
        }
        // --- [THE FIX] ---
        // Add the props to the fallback render
        return (
          <CoursesPage 
            setCurrentPage={setCurrentPage} 
            setSelectedCourse={setSelectedCourse} 
          />
        )
      case "meet":
        return <MeetSchedulerPage />
      case "scraper":
        return <ScraperPage />
      case "flashcards":
        if (flashcardParams) {
          return <FlashcardsPage 
            courseId={flashcardParams.courseId} 
            fileId={flashcardParams.fileId}
            setCurrentPage={setCurrentPage}
          />
        }
        return <Dashboard />

      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">{renderPage()}</main>
    </div>
  )
}

export default App
