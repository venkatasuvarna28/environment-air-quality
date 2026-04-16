package com.airquality.repository;


import com.airquality.entity.*;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

public interface ReadingRepository extends JpaRepository<Reading, Integer> {
    @Query(value= "SELECT station_id, COUNT(*) as cnt FROM reading GROUP BY station_id",nativeQuery=true)
    List<Object[]> getDailyExceedCount();
    @Query(value="SELECT EXTRACT( HOUR FROM `timestamp`), AVG(value) FROM reading " + "GROUP BY EXTRACT(HOUR FROM `timestamp`)" + "ORDER BY AVG(value) DESC LIMIT 1", nativeQuery=true)
    List<Object[]> getWorstHour();

}