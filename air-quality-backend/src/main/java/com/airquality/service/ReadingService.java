package com.airquality.service;
import java.util.List;

import com.airquality.entity.*;

import com.airquality.repository.*;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;

import java.util.*;

@Service

public class ReadingService {

    @Autowired

    private ReadingRepository readingRepo;

    @Autowired

    private LimitRepository limitRepo;

    public List<Reading> getAll() {

        return readingRepo.findAll();

    }  public Reading save(Reading r) {

        return readingRepo.save(r);

    }

    public List<Reading> getExceed() {

        List<Reading> list = readingRepo.findAll();

        List<Reading> result = new ArrayList<>();

        for (Reading r : list) {

            LimitValue l = limitRepo.findById(r.getPollutantId()).orElse(null);

            if (l != null && r.getValue() > l.getSafeLimit()) {

                result.add(r);

            }

        }

        return result;
    }
    public List<Object[]> getDailyExceed()
    {
        return readingRepo.getDailyExceedCount();
    }
    public Object[] getWorstHour() {
        List<Object[]> list = readingRepo.getWorstHour();
        if(list !=null && list.size() > 0)
        {
            return list.get(0);
        }
        return new Object[]{0,0};
    }


}
