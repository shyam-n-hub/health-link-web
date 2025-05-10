
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HtmlWrapper from "./components/HtmlWrapper";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HtmlWrapper />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
