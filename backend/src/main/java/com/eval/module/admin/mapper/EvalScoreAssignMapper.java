package com.eval.module.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.eval.module.admin.entity.EvalScoreAssign;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.util.Collection;

@Mapper
public interface EvalScoreAssignMapper extends BaseMapper<EvalScoreAssign> {

    @Update("DELETE FROM eval_score_assign WHERE period_id = #{periodId}")
    int hardDeleteByPeriod(@Param("periodId") Long periodId);

    @Update({
            "<script>",
            "DELETE FROM eval_score_assign",
            "WHERE period_id = #{periodId}",
            "AND target_id IN",
            "<foreach collection='targetIds' item='id' open='(' separator=',' close=')'>",
            "#{id}",
            "</foreach>",
            "</script>"
    })
    int hardDeleteByPeriodAndTargetIds(@Param("periodId") Long periodId, @Param("targetIds") Collection<Long> targetIds);

    @Update("UPDATE eval_score_assign " +
            "SET weight = #{weight}, status = #{status}, deleted = 0, update_time = NOW() " +
            "WHERE period_id = #{periodId} AND scorer_id = #{scorerId} AND target_id = #{targetId} AND eval_type = #{evalType} " +
            "LIMIT 1")
    int reviveDeletedAssign(@Param("periodId") Long periodId,
                            @Param("scorerId") Long scorerId,
                            @Param("targetId") Long targetId,
                            @Param("evalType") String evalType,
                            @Param("weight") BigDecimal weight,
                            @Param("status") Integer status);
}
