package com.airquality.entity;

import jakarta.persistence.*;

@Entity

public class LimitValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private int id;

    private int pollutantId;

    private double safeLimit;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getPollutantId() {
        return pollutantId;
    }

    public void setPollutantId(int pollutantId) {
        this.pollutantId = pollutantId;
    }


    public double getSafeLimit() {
        return safeLimit;
    }

    public void setSafeLimit(double safeLimit) {
        this.safeLimit = safeLimit;
    }
}