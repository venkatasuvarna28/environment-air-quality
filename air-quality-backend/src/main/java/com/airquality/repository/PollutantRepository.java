package com.airquality.repository;

import com.airquality.entity.Pollutant;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PollutantRepository extends JpaRepository<Pollutant, Integer> {}
