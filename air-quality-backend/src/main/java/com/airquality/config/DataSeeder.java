package com.airquality.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.airquality.entity.AdminUser;
import com.airquality.entity.LimitValue;
import com.airquality.repository.AdminUserRepository;
import com.airquality.repository.LimitRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private LimitRepository limitRepository;

    @Override
    public void run(String... args) {
        // Seed default admin user
        if (adminUserRepository.count() == 0) {
            AdminUser admin = new AdminUser();
            admin.setUsername("aq_admin");
            admin.setPassword("AQ@2026");
            adminUserRepository.save(admin);
            System.out.println("✅ Default admin user created: aq_admin / AQ@2026");
        }

        // Seed default PM2.5 limit (pollutantId=1) and CO2 limit (pollutantId=2)
        if (limitRepository.count() == 0) {
            LimitValue pm25 = new LimitValue();
            pm25.setPollutantId(1);
            pm25.setSafeLimit(100.0);
            limitRepository.save(pm25);

            LimitValue co2 = new LimitValue();
            co2.setPollutantId(2);
            co2.setSafeLimit(500.0);
            limitRepository.save(co2);

            System.out.println("✅ Default limits seeded: PM2.5=100, CO2=500");
        }
    }
}
