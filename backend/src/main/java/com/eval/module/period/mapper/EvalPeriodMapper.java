package com.eval.module.period.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.eval.module.period.entity.EvalPeriod;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;

@Mapper
public interface EvalPeriodMapper extends BaseMapper<EvalPeriod> {

    @Update("DELETE FROM eval_period WHERE id = #{id}")
    int hardDeleteById(@Param("id") Long id);

    @Update("UPDATE eval_period SET period_name = #{periodName}, status = #{status}, start_time = #{startTime}, end_time = #{endTime}, deleted = 0, update_time = NOW() " +
            "WHERE year = #{year} AND month = #{month} AND deleted = 1 LIMIT 1")
    int reviveDeletedPeriod(@Param("periodName") String periodName,
                            @Param("year") Integer year,
                            @Param("month") Integer month,
                            @Param("status") Integer status,
                            @Param("startTime") LocalDateTime startTime,
                            @Param("endTime") LocalDateTime endTime);
}
