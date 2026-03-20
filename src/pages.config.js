/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import CH from './pages/CH';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Diet from './pages/Diet';
import ExerciseLibrary from './pages/ExerciseLibrary';
import FoodDatabase from './pages/FoodDatabase';
import MyDiet from './pages/MyDiet';
import MyWorkout from './pages/MyWorkout';
import Onboarding from './pages/Onboarding';
import PendingStudents from './pages/PendingStudents';
import Progress from './pages/Progress.jsx';
import StudentDashboard from './pages/StudentDashboard';
import StudentDocuments from './pages/StudentDocuments';
import StudentWorkout from './pages/StudentWorkout';
import Students from './pages/Students';
import TimerPage from './pages/TimerPage';
import Welcome from './pages/Welcome';
import WorkoutPlans from './pages/WorkoutPlans';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CH": CH,
    "Chat": Chat,
    "Dashboard": Dashboard,
    "Diet": Diet,
    "ExerciseLibrary": ExerciseLibrary,
    "FoodDatabase": FoodDatabase,
    "MyDiet": MyDiet,
    "MyWorkout": MyWorkout,
    "Onboarding": Onboarding,
    "PendingStudents": PendingStudents,
    "Progress": Progress,
    "StudentDashboard": StudentDashboard,
    "StudentDocuments": StudentDocuments,
    "StudentWorkout": StudentWorkout,
    "Students": Students,
    "TimerPage": TimerPage,
    "Welcome": Welcome,
    "WorkoutPlans": WorkoutPlans,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};