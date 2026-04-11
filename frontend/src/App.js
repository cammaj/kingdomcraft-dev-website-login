import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { MaintenancePage } from "./pages/MaintenancePage";
import { RulesPage } from "./pages/RulesPage";

function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<MaintenancePage />} />
                        <Route path="/rules" element={<RulesPage />} />
                    </Routes>
                </BrowserRouter>
            </LanguageProvider>
        </ThemeProvider>
    );
}

export default App;
