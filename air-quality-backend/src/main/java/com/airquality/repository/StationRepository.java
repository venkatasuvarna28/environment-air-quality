package com.airquality.repository;

import com.airquality.entity.Station;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StationRepository extends JpaRepository<Station, Integer> { }