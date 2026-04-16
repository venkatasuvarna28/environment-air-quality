package com.airquality.service;
import com.airquality.entity.Reading;
import com.airquality.repository.ReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.*;
@Service
public class ReportService {
    @Autowired
    private ReadingRepository repo;
    public Map<String, Double> buildDaily() {
        List<Reading> readings = repo.findAll();
        Map<String, List<Double>> temp = new HashMap<>();
        for (Reading r : readings) {
            String  date = r.getTimestamp().toLocalDate().toString();
            temp.putIfAbsent(date, new ArrayList<>());
            temp.get(date).add(r.getValue());
        }
        Map<String, Double> result = new HashMap<>();
        for (String d : temp.keySet()) {
            List<Double> values = temp.get(d);
            double sum = 0;
            for (double v : values) {
                sum += v;
            }
            result.put(d, sum / values.size());
        }
        return result;
    }
}