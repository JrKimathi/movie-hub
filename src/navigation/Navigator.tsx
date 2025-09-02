import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Series from "../pages/Series";
import Actors from "../pages/Actors";
import ActorDetails from "../pages/ActorDetails";
import Genres from "../pages/Genre";
import Auth from '../components/Auth';
import SearchResults from "../pages/SearchResults";
import MovieDetails from "../components/MovieDetails";
import SeriesDetails from "../components/SeriesDetails";

const Navigator: React.FC = () => {
  return (
    <Router>
      <Routes>
 
        <Route path="/" element={<Home />} />

        <Route path="/series" element={<Series />} />
        <Route path="/series/:id" element={<SeriesDetails />} />
        <Route path="/actors" element={<Actors />} />
        <Route path="/actors/:id" element={<ActorDetails />} />
        <Route path="/genres/:id" element={<Genres />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default Navigator;
