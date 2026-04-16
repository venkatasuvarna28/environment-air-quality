package com.airquality.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity

public class Reading {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)

    private int id;

    private int stationId;

    private int pollutantId;

    private double value;

    private LocalDateTime timestamp;

    public int getId() { return id; }

    public void setId(int id) { this.id = id; }

    public int getStationId() { return stationId; }

    public void setStationId(int stationId) { this.stationId = stationId; }

    public int getPollutantId() { return pollutantId; }

    public void setPollutantId(int pollutantId) { this.pollutantId = pollutantId; }

    public double getValue() { return value; }

    public void setValue(double value) { this.value = value; }

    public LocalDateTime getTimestamp() { return timestamp; }

    public void setTimestamp(LocalDateTime timestamp) { this.timestamp =

            timestamp; }

}