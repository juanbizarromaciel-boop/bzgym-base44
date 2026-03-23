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
import PRBoard from './pages/PRBoard.jsx';
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
    "PRBoard": PRBoard,
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