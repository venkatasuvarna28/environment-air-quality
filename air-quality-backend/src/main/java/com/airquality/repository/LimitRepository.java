package com.airquality.repository;

import com.airquality.entity.LimitValue;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LimitRepository extends JpaRepository<LimitValue, Integer> {
    java.util.Optional<LimitValue> findByPollutantId(int pollutantId);
}