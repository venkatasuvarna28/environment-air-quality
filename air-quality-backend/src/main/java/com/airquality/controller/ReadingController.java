package com.airquality.controller;

import com.airquality.entity.Reading;

import com.airquality.service.ReadingService;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.util.Map;
import com.airquality.service.ReportService;


@RestController

@RequestMapping("/api/readings")

@CrossOrigin("*")

public class ReadingController {

    @Autowired private ReadingService service;
    @Autowired private ReportService reportservice;

    @GetMapping

    public List<Reading> getAll() {

        return service.getAll();

    }

    @PostMapping

    public Reading add(@RequestBody Reading r) {

        return service.save(r);

    }

    @GetMapping("/exceed")

    public List<Reading> exceed() {

        return service.getExceed();

    }
    @GetMapping("/exceed/daily")
    public List<Object[]> getDaily()
    {
        return service.getDailyExceed();
    }
    @GetMapping("/worst-hour")
    public Object[] worstHour(){
        return service.getWorstHour();
    }
    @GetMapping("/daily-report")
    public Map<String,Double> getDailyReport(){
        return reportservice.buildDaily();
    }


}
