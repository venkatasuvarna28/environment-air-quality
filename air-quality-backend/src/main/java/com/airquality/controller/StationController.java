package com.airquality.controller;
import com.airquality.entity.Station;
import com.airquality.repository.StationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stations")
@CrossOrigin("*")

public class StationController {
    @Autowired
    private StationRepository repo;
    @GetMapping
    public List<Station> getAllStations() {
        return repo.findAll();
    }
}

